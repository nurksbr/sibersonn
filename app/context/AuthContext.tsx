'use client';

import { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

// Kullanıcı tipi
export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isAdmin?: boolean; // Admin olup olmadığını belirten özellik
};

// Auth context tipleri
export type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage anahtarı
const USER_STORAGE_KEY = 'cyberly_user';

// Özel olay ekleyelim - oturum değişikliği için
export const AUTH_CHANGE_EVENT = 'auth_state_changed';

// LocalStorage'dan kullanıcı bilgisini al
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('LocalStorage hatası:', error);
    return null;
  }
};

// LocalStorage'a kullanıcı bilgisini kaydet
const storeUser = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Mevcut kullanıcıyı kontrol et
    const existingUserStr = localStorage.getItem(USER_STORAGE_KEY);
    const existingUser = existingUserStr ? JSON.parse(existingUserStr) : null;
    
    // Aynı kullanıcı ise gereksiz yere event tetikleme ve localstorage güncelleme
    if (user && existingUser && user.id === existingUser.id) {
      // Eğer aynı kullanıcıysa, sadece kritik alanlar değişmişse güncelle
      if (JSON.stringify(user) === JSON.stringify(existingUser)) {
        // Tamamen aynıysa hiçbir şey yapma
        return;
      }
    }
    
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      // Özel olay tetikle
      const authEvent = new CustomEvent(AUTH_CHANGE_EVENT, { detail: { user } });
      window.dispatchEvent(authEvent);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      // Özel olay tetikle - çıkış durumu
      const authEvent = new CustomEvent(AUTH_CHANGE_EVENT, { detail: { user: null } });
      window.dispatchEvent(authEvent);
    }
  } catch (error) {
    console.error('LocalStorage kayıt hatası:', error);
  }
};

// AuthProvider bileşeni
export function AuthProvider({ children }: { children: ReactNode }) {
  // Router tanımla
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // LocalStorage'dan başlangıç kullanıcı durumu
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Kullanıcı durumu değiştiğinde LocalStorage'ı güncelle
  const userRef = useRef<User | null>(user);
  
  // NextAuth session değişikliklerini dinle
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // NextAuth session'ından kullanıcı bilgilerini al
      const sessionUser: User = {
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        role: session.user.role || 'USER',
        isAdmin: session.user.isAdmin || false
      };

      setUser(sessionUser);
      storeUser(sessionUser);
      setLoading(false);
    } else if (status === 'unauthenticated') {
      setUser(null);
      storeUser(null);
      setLoading(false);
    }
  }, [session, status]);

  // Sadece kullanıcı değiştiğinde etkileyecek şekilde güncelle
  useEffect(() => {
    // userRef'ten farklıysa güncelle
    if (JSON.stringify(user) !== JSON.stringify(userRef.current)) {
      userRef.current = user;
      storeUser(user);
    }
  }, [user]);

  // Kullanıcı oturumunu kontrol et
  const checkAuth = async (): Promise<boolean> => {
    try {
      // NextAuth session durumunu kontrol et
      if (status === 'authenticated' && session?.user) {
        return true;
      }
      
      // LocalStorage'da kullanıcı bilgisi varsa kontrol et
      const storedUser = getStoredUser();
      if (storedUser && status !== 'unauthenticated') {
        setUser(storedUser);
        return true;
      }
      
      setUser(null);
      storeUser(null);
      return false;
    } catch (error) {
      console.error('checkAuth: Oturum kontrolü hatası:', error);
      setUser(null);
      storeUser(null);
      return false;
    }
  };

  // Giriş fonksiyonu - NextAuth signIn kullan
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('NextAuth signIn başlatılıyor:', email);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Otomatik yönlendirmeyi kapat
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        console.log('NextAuth signIn başarılı');
        
        // Session yenilenmesini bekle
        setTimeout(() => {
          // Callback URL varsa doğrudan yönlendir, yoksa ana sayfaya
          const callbackUrl = searchParams?.get('callbackUrl');
          
          if (callbackUrl) {
            try {
              router.push(decodeURIComponent(callbackUrl));
            } catch (navigateError) {
              window.location.href = decodeURIComponent(callbackUrl);
            }
          } else {
            try {
              router.push('/');
            } catch (navigateError) {
              window.location.href = '/';
            }
          }
        }, 100);
      } else {
        throw new Error('Giriş işlemi başarısız oldu');
      }
    } catch (error) {
      console.error('Login hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış işlemi - NextAuth signOut kullan
  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      // LocalStorage temizliği
      if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem('cyberly_token');
        sessionStorage.removeItem(USER_STORAGE_KEY);
        
        // Olay yayınla
        const authEvent = new CustomEvent(AUTH_CHANGE_EVENT, { 
          detail: { user: null, loggedIn: false } 
        });
        window.dispatchEvent(authEvent);
      }
      
      // State'i hemen güncelle
      setUser(null);
      
      // NextAuth signOut
      await signOut({
        redirect: false
      });
      
      // Giriş sayfasına yönlendir
      router.push('/giris');
    } catch (error) {
      console.error('Logout hatası:', error);
      // Hata durumunda da temizlik yap
      setUser(null);
      storeUser(null);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem('cyberly_token');
        window.location.href = '/giris';
      }
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading: loading || status === 'loading',
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Auth context hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth hook must be used within an AuthProvider');
  }
  return context;
}