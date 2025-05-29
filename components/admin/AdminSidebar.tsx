'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Shield, 
  Book, 
  Home,
  LogOut,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Mail,
  PieChart,
  User,
  ArrowLeft
} from 'lucide-react'
import { useState } from 'react'

// cn utility fonksiyonu
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin-panel',
    icon: LayoutDashboard
  },
  {
    title: 'Kullanıcılar',
    href: '/admin-panel/users',
    icon: Users
  },
  {
    title: 'Eğitimler',
    href: '/admin-panel/egitimler',
    icon: Book
  },
  {
    title: 'Blog',
    href: '/admin-panel/blog',
    icon: PieChart
  },
  {
    title: 'Ayarlar',
    href: '/admin-panel/settings',
    icon: Settings
  }
]

export default function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    setIsNavigating(true)
    console.log(`Navigating to: ${href}`)
    
    // Yönlendirme işlemini gerçekleştir
    router.push(href)
    
    // İşlem tamamlandı
    setTimeout(() => setIsNavigating(false), 1000)
  }

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      console.log('Çıkış yapılıyor...')
      setIsNavigating(true)
      
      // LocalStorage'ı temizle
      localStorage.removeItem('cyberly_user')
      localStorage.removeItem('cyberly_token')
      
      // Tüm sibergercek ile ilgili localStorage verilerini temizle
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cyberly_')) {
          localStorage.removeItem(key)
        }
      })
      
      // Cookie'yi temizle
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
      
      // Giriş sayfasına yönlendir
      router.push('/giris')
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error)
      // Hata durumunda zorla çıkış yap
      localStorage.removeItem('cyberly_user')
      localStorage.removeItem('cyberly_token')
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      window.location.href = '/giris'
    } finally {
      setIsNavigating(false)
    }
  }

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 h-screen relative z-10 shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-sm text-gray-400 mt-2">Sistem Yönetimi</p>
      </div>
      <nav className="space-y-2 px-4 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavigation(item.href, e)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                isActive 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800',
                isNavigating && 'pointer-events-none opacity-50'
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-white" : "text-gray-400 group-hover:text-cyan-400"
              )} />
              <span>{item.title}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </a>
          )
        })}
        
        {/* Separator */}
        <div className="my-4 border-t border-gray-700"></div>
        
        {/* Profile Link */}
        <a
          href="/admin-panel/profile"
          onClick={(e) => handleNavigation('/admin-panel/profile', e)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
            pathname === '/admin-panel/profile' 
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
              : 'text-gray-300 hover:text-white hover:bg-gray-800',
            isNavigating && 'pointer-events-none opacity-50'
          )}
        >
          <User className={cn(
            "h-4 w-4 transition-colors",
            pathname === '/admin-panel/profile' ? "text-white" : "text-gray-400 group-hover:text-cyan-400"
          )} />
          <span>Profilim</span>
          {pathname === '/admin-panel/profile' && (
            <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
          )}
        </a>
        
        {/* Ana Siteye Dön Link */}
        <a
          href="/"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
            "text-gray-300 hover:text-white hover:bg-cyan-600/20 border border-transparent hover:border-cyan-500/30",
            isNavigating && "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowLeft className="h-4 w-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <Home className="h-4 w-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="group-hover:text-cyan-300">Ana Siteye Dön</span>
        </a>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isNavigating}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group mt-4",
            "text-gray-300 hover:text-white hover:bg-red-600/20 border border-transparent hover:border-red-500/30",
            isNavigating && "opacity-50 cursor-not-allowed"
          )}
        >
          <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-300 transition-colors" />
          <span className="group-hover:text-red-300">Çıkış Yap</span>
          {isNavigating && (
            <div className="ml-auto w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>
      </nav>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>v1.0.0</span>
          <span>CYBERLY</span>
        </div>
      </div>
    </div>
  )
} 