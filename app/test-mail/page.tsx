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
function TestMailContent() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; messageId?: string } | null>(null)

  const sendTestMail = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      // Ağ hatalarını yakalayabilmek için timeout ekleyelim
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch('/api/test-mail', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Hata detaylarını almaya çalış
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Gelen veriyi doğrula
      if (typeof data !== 'object') {
        throw new Error('Geçersiz API yanıtı formatı');
      }
      
      setResult(data);
      console.log('Mail gönderme sonucu:', data);
    } catch (error) {
      console.error('Mail gönderme hatası:', error);
      
      // Hata AbortError mi (timeout)?
      if (error.name === 'AbortError') {
        setResult({ 
          success: false, 
          error: 'İstek zaman aşımına uğradı. Sunucu yanıt vermiyor.' 
        });
      } else {
        setResult({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">Mail Testi</h1>
          <p className="mt-2 text-gray-300">Bu sayfa mail sunucusunu test etmek için kullanılır.</p>
        </div>
        
        <div className="text-center py-6">
          <button 
            onClick={sendTestMail}
            disabled={loading}
            className={`inline-flex items-center justify-center px-6 py-3 rounded-md transition-colors ${
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
              'Test Maili Gönder'
            )}
          </button>
          
          {result && (
            <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
              {result.success ? (
                <>
                  <p className="font-bold mb-2">Başarılı!</p>
                  <p>{result.message}</p>
                  {result.messageId && <p className="text-xs mt-2">Message ID: {result.messageId}</p>}
                </>
              ) : (
                <>
                  <p className="font-bold mb-2">Hata!</p>
                  <p>{result.error || 'Bir hata oluştu.'}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TestMailPage() {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback} 
      onReset={() => console.log('Hata sıfırlandı')}
    >
      <TestMailContent />
    </ErrorBoundary>
  )
} 