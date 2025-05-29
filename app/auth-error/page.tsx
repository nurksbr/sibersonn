'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Hata mesajlarını daha kullanıcı dostu yapma
const getErrorMessage = (error: string | null): string => {
  if (!error) return 'Bilinmeyen bir hata oluştu'
  
  switch (error) {
    case 'CredentialsSignin':
      return 'Geçersiz e-posta veya şifre'
    case 'EmailSignin':
      return 'E-posta ile giriş başarısız oldu'
    case 'OAuthAccountNotLinked':
      return 'Bu e-posta başka bir giriş yöntemiyle ilişkilendirilmiş'
    case 'SessionRequired':
      return 'Bu sayfaya erişmek için giriş yapmanız gerekiyor'
    case 'Default':
    default:
      return 'Oturum açma işlemi sırasında bir hata oluştu'
  }
}

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string>('Yükleniyor...')
  
  useEffect(() => {
    const error = searchParams?.get('error')
    setErrorMessage(getErrorMessage(error))
  }, [searchParams])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-400">Giriş Hatası</h1>
        </div>
        
        <div className="text-center py-6">
          <div className="bg-red-900/30 text-red-300 p-4 rounded-md mb-6">
            <p className="font-bold mb-2">Hata!</p>
            <p>{errorMessage}</p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Link 
              href="/giris" 
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors"
            >
              Giriş Sayfasına Dön
            </Link>
            
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 