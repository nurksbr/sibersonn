'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import UserMenu from '../../app/components/UserMenu'
import { FaShieldAlt, FaArrowLeft, FaHome } from 'react-icons/fa'
import Link from 'next/link'

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()

  // Client tarafında admin kontrolü yap
  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      console.log('Admin paneli: Kullanıcı giriş yapmamış')
      router.push('/giris')
      return
    }
    
    // Admin kontrolü yap
    if (session?.user && !session.user.isAdmin) {
      console.log('Admin paneli: Kullanıcı admin değil')
      router.push('/')
      return
    }
    
    setLoading(false)
  }, [router, session, status])

  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900 relative z-20 pointer-events-auto">
      <AdminSidebar />
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Admin Header */}
        <header className="bg-gray-800 border-b border-gray-700 shadow-lg backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Logo ve Başlık */}
            <div className="flex items-center">
              {/* Geri Dönme Butonu */}
              <div className="flex items-center">
                <Link 
                  href="/" 
                  className="flex items-center px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 rounded-lg transition-all duration-200 group"
                  title="Ana siteye dön"
                >
                  <FaArrowLeft className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 mr-2 transition-colors" />
                  <FaHome className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 sm:mr-2 transition-colors" />
                  <span className="hidden sm:block text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Ana Siteye Dön</span>
                </Link>
              </div>
            </div>

            {/* Sağ Taraf - Search ve User Menu */}
            <div className="flex items-center space-x-4">
              {/* Kullanıcı Menüsü */}
              <div className="flex items-center bg-gray-700/30 rounded-xl p-1">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 bg-gray-900 text-gray-100 min-h-0 overflow-auto">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 