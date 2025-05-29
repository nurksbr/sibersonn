'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function EmailVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      setError('Doğrulama tokeni eksik')
      return
    }
    
    // Token'ı doğrula
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`)
        const data = await response.json()
        
        if (response.ok) {
          setSuccess(true)
          // Başarılı doğrulama durumunda 3 saniye sonra giriş sayfasına yönlendir
          setTimeout(() => {
            router.push('/giris')
          }, 3000)
        } else {
          setError(data.error || 'Doğrulama işlemi başarısız oldu')
        }
      } catch (error) {
        console.error('Doğrulama hatası:', error)
        setError('Doğrulama işlemi sırasında bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }
    
    verifyToken()
  }, [token, router])

  // Resend verification email function
  const handleResendEmail = async () => {
    if (!email) {
      setResendMessage('Lütfen e-posta adresinizi girin')
      return
    }

    setResendLoading(true)
    setResendMessage(null)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage(data.message || 'Doğrulama e-postası gönderildi!')
      } else {
        setResendMessage(data.error || 'E-posta gönderilemedi')
      }
    } catch (error) {
      console.error('Resend error:', error)
      setResendMessage('E-posta gönderilirken bir hata oluştu')
    } finally {
      setResendLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">E-posta Doğrulama</h1>
        </div>
        
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
            <p>E-posta adresiniz doğrulanıyor, lütfen bekleyin...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-6">
            <div className="bg-red-900/30 text-red-300 p-4 rounded-md mb-6">
              <p className="font-bold mb-2">Hata!</p>
              <p>{error}</p>
            </div>
            
            {/* Resend email section */}
            <div className="bg-gray-800/50 p-4 rounded-md mb-4">
              <p className="text-gray-300 mb-3">Doğrulama e-postanızı tekrar almak için e-posta adresinizi girin:</p>
              <div className="flex flex-col space-y-3">
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
                >
                  {resendLoading ? 'Gönderiliyor...' : 'Doğrulama E-postası Gönder'}
                </button>
                {resendMessage && (
                  <p className={`text-sm ${resendMessage.includes('başarı') || resendMessage.includes('gönderildi') ? 'text-green-400' : 'text-red-400'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
            
            <Link 
              href="/giris" 
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors"
            >
              Giriş Sayfasına Dön
            </Link>
          </div>
        )}
        
        {success && (
          <div className="text-center py-6">
            <div className="bg-green-900/30 text-green-300 p-4 rounded-md mb-6">
              <p className="font-bold mb-2">Başarılı!</p>
              <p>E-posta adresiniz başarıyla doğrulandı.</p>
              <p className="mt-2 text-sm">Birkaç saniye içinde giriş sayfasına yönlendirileceksiniz.</p>
            </div>
            <Link 
              href="/giris" 
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors"
            >
              Giriş Sayfasına Git
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 