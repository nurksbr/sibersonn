'use client'

import { SessionProvider } from 'next-auth/react'
import { ErrorBoundary } from 'react-error-boundary'

// Hata işleme bileşeni
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md my-4 text-red-700 dark:text-red-300">
      <p className="font-bold">Bir hata oluştu:</p>
      <p className="mt-1">{error.message || 'Bilinmeyen bir hata oluştu'}</p>
      <button 
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 rounded-md text-sm"
      >
        Yeniden Dene
      </button>
    </div>
  )
}

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Hatayı sıfırla
        console.log('Hata sıfırlanıyor')
      }}
    >
      <SessionProvider 
        refetchInterval={60}  // Her 60 saniyede bir session'ı kontrol et
        refetchOnWindowFocus={true}  // Pencere odaklandığında session'ı kontrol et
        refetchWhenOffline={false}
      >
        {children}
      </SessionProvider>
    </ErrorBoundary>
  )
} 