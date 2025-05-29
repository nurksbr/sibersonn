'use client'

import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 bg-red-900/30 rounded-md text-red-300">
      <p className="font-bold mb-2">Hata!</p>
      <p>{error.message || 'Bir hata oluştu.'}</p>
      <button 
        onClick={resetErrorBoundary}
        className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white"
      >
        Yeniden Dene
      </button>
    </div>
  )
}

// Ana bileşen
function MailTestContent() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; messageId?: string } | null>(null)
  
  // Form state
  const [to, setTo] = useState('mikailsun21@gmail.com')
  const [subject, setSubject] = useState('CYBERLY - Test E-postası')
  const [content, setContent] = useState('Bu bir test e-postasıdır. Mail sunucusu başarıyla çalışıyor!')

  // Basit mail gönderme
  const handleSendTestEmail = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch('/api/test-mail', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (typeof data !== 'object') {
        throw new Error('Geçersiz API yanıtı formatı')
      }
      
      setResult(data)
      console.log('Mail gönderme sonucu:', data)
    } catch (error) {
      console.error('Mail gönderme hatası:', error)
      
      if (error.name === 'AbortError') {
        setResult({ 
          success: false, 
          error: 'İstek zaman aşımına uğradı. Sunucu yanıt vermiyor.' 
        })
      } else {
        setResult({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
        })
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Özel mail gönderme
  const sendCustomTestMail = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setResult(null)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch('/api/test/send-mail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          content
        }),
        cache: 'no-store',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (typeof data !== 'object') {
        throw new Error('Geçersiz API yanıtı formatı')
      }
      
      setResult(data)
      console.log('Mail gönderme sonucu:', data)
    } catch (error) {
      console.error('Mail gönderme hatası:', error)
      
      if (error.name === 'AbortError') {
        setResult({ 
          success: false, 
          error: 'İstek zaman aşımına uğradı. Sunucu yanıt vermiyor.' 
        })
      } else {
        setResult({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Direkt mail gönderme
  const sendDirectTestMail = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch('/api/mail/direct-test', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (typeof data !== 'object') {
        throw new Error('Geçersiz API yanıtı formatı')
      }
      
      setResult(data)
      console.log('Direkt mail gönderme sonucu:', data)
    } catch (error) {
      console.error('Direkt mail gönderme hatası:', error)
      
      if (error.name === 'AbortError') {
        setResult({ 
          success: false, 
          error: 'İstek zaman aşımına uğradı. Sunucu yanıt vermiyor.' 
        })
      } else {
        setResult({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">Mail Sunucusu Testi</h1>
          <p className="mt-2 text-gray-300">Bu sayfa mail sunucusunu test etmek için kullanılır.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basit Test */}
          <div className="bg-gray-700/50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-cyan-300">Hızlı Test</h2>
            <p className="text-gray-300 mb-4">Varsayılan ayarlarla hızlı bir test maili gönderir.</p>
            
            <button 
              onClick={handleSendTestEmail}
              disabled={loading}
              className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-md transition-colors ${
                loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'
              } mb-4`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gönderiliyor...
                </>
              ) : (
                'Test Mail Gönder'
              )}
            </button>
            
            <button 
              onClick={sendDirectTestMail}
              disabled={loading}
              className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-md transition-colors ${
                loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gönderiliyor...
                </>
              ) : (
                'Alternatif Yöntem ile Gönder'
              )}
            </button>
          </div>
          
          {/* Özel Test */}
          <div className="bg-gray-700/50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-cyan-300">Özel Test</h2>
            <form onSubmit={sendCustomTestMail}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">Alıcı E-posta</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">Konu</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">İçerik</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[80px]"
                  required
                />
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-md transition-colors ${
                  loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gönderiliyor...
                  </>
                ) : (
                  'Özel Mail Gönder'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Sonuç Gösterimi */}
        {result && (
          <div className={`mt-8 p-6 rounded-md ${result.success ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            <h3 className="text-lg font-bold mb-2">{result.success ? 'Başarılı!' : 'Hata!'}</h3>
            <p className="mb-2">{result.message || result.error || 'İşlem tamamlandı.'}</p>
            {result.messageId && <p className="text-xs mt-2">Message ID: {result.messageId}</p>}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Mail sunucusu yapılandırması: smtp.gmail.com:587 (TLS) - fevziyenurksbr1@gmail.com
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MailTestPage() {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback} 
      onReset={() => console.log('Hata sıfırlandı')}
    >
      <MailTestContent />
    </ErrorBoundary>
  )
} 