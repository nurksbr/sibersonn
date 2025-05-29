'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import { FaUsers, FaChartBar, FaCog, FaShieldAlt, FaDatabase, FaExclamationTriangle, FaCheckCircle, FaUserShield, FaEnvelope, FaClipboard } from 'react-icons/fa'

interface User {
  id: string
  name: string
  email: string
  role: string
  isEmailVerified: boolean
  createdAt: string
}

interface SystemStats {
  totalUsers: number
  verifiedUsers: number
  adminUsers: number
  recentRegistrations: number
}

interface SystemActivity {
  id: string
  type: 'user_registered' | 'user_login' | 'role_changed' | 'user_deleted'
  message: string
  timestamp: Date
  userId?: string
  userName?: string
}

export default function AdminPanel() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0,
    recentRegistrations: 0
  })
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/giris')
    }
  }, [user, loading, router])

  // Real-time polling için interval
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchData()
    }, 10000) // Her 10 saniyede bir güncelle

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Token'ı hem localStorage'dan hem de cookie'den almaya çalış
      let token = localStorage.getItem('cyberly_token')
      
      // Eğer localStorage'da token yoksa cookie'den al
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='))
        if (authCookie) {
          token = authCookie.split('=')[1]
        }
      }
      
      console.log('Admin panel token:', token ? 'Token bulundu' : 'Token bulunamadı')
      console.log('Kullanıcı bilgisi:', user)
      
      if (!token) {
        console.error('Token bulunamadı - giriş yapmanız gerekebilir')
        return
      }
      
      // Kullanıcıları getir
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie'ler için
      })
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
        
        // İstatistikleri hesapla
        const totalUsers = usersData.users?.length || 0
        const verifiedUsers = usersData.users?.filter((u: User) => u.isEmailVerified).length || 0
        const adminUsers = usersData.users?.filter((u: User) => u.role === 'ADMIN').length || 0
        const now = new Date()
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const recentRegistrations = usersData.users?.filter((u: User) => 
          new Date(u.createdAt) > lastWeek
        ).length || 0
        
        setStats({
          totalUsers,
          verifiedUsers,
          adminUsers,
          recentRegistrations
        })
        
        // Sistem aktivitelerini oluştur
        const newActivities: SystemActivity[] = []
        
        // Son 5 kullanıcı kaydı için aktivite oluştur
        usersData.users?.slice(-5).forEach((user: User) => {
          newActivities.push({
            id: `reg_${user.id}`,
            type: 'user_registered',
            message: `${user.name || 'Yeni kullanıcı'} sisteme kayıt oldu`,
            timestamp: new Date(user.createdAt),
            userId: user.id,
            userName: user.name
          })
        })
        
        // Admin kullanıcıları için aktivite
        usersData.users?.filter((u: User) => u.role === 'ADMIN').forEach((user: User) => {
          newActivities.push({
            id: `admin_${user.id}`,
            type: 'role_changed',
            message: `${user.name || user.email} admin yetkisi aldı`,
            timestamp: new Date(user.createdAt),
            userId: user.id,
            userName: user.name
          })
        })
        
        // Aktiviteleri zamana göre sırala ve son 10'unu al
        const sortedActivities = newActivities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10)
        
        setActivities(sortedActivities)
        
        // Güncelleme zamanını kaydet
        setLastUpdate(new Date())
      } else {
        console.error('Admin verileri getirilemedi:', usersResponse.status)
      }
    } catch (error) {
      console.error('Admin verilerini getirirken hata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Token'ı hem localStorage'dan hem de cookie'den almaya çalış
      let token = localStorage.getItem('cyberly_token')
      
      // Eğer localStorage'da token yoksa cookie'den al
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='))
        if (authCookie) {
          token = authCookie.split('=')[1]
        }
      }
      
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // Kullanıcı listesini güncelle
        fetchData()
        
        // Aktivite ekle
        const targetUser = users.find(u => u.id === userId)
        if (targetUser) {
          const newActivity: SystemActivity = {
            id: `role_${userId}_${Date.now()}`,
            type: 'role_changed',
            message: `${targetUser.name || targetUser.email} rolü ${newRole} olarak değiştirildi`,
            timestamp: new Date(),
            userId: targetUser.id,
            userName: targetUser.name
          }
          setActivities(prev => [newActivity, ...prev.slice(0, 9)])
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Rol güncellemesi başarısız oldu')
      }
    } catch (error) {
      console.error('Rol güncellemesi hatası:', error)
      alert('Rol güncellemesi sırasında hata oluştu')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      // Token'ı hem localStorage'dan hem de cookie'den almaya çalış
      let token = localStorage.getItem('cyberly_token')
      
      // Eğer localStorage'da token yoksa cookie'den al
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='))
        if (authCookie) {
          token = authCookie.split('=')[1]
        }
      }
      
      // Silinen kullanıcı bilgisini aktivite için sakla
      const targetUser = users.find(u => u.id === userId)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        fetchData()
        
        // Aktivite ekle
        if (targetUser) {
          const newActivity: SystemActivity = {
            id: `delete_${userId}_${Date.now()}`,
            type: 'user_deleted',
            message: `${targetUser.name || targetUser.email} kullanıcısı silindi`,
            timestamp: new Date(),
            userId: targetUser.id,
            userName: targetUser.name
          }
          setActivities(prev => [newActivity, ...prev.slice(0, 9)])
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Kullanıcı silme işlemi başarısız oldu')
      }
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error)
      alert('Kullanıcı silme sırasında hata oluştu')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <FaShieldAlt className="mx-auto h-12 w-12 text-cyan-500 animate-pulse mb-4" />
          <p className="text-lg">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="w-full h-full">
      <div className="w-full">
        {/* Başlık */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FaShieldAlt className="h-8 w-8 text-cyan-500 mr-3" />
              <h1 className="text-3xl font-bold text-white">Yönetim Paneli</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {autoRefresh ? '🔄 Otomatik' : '⏸️ Durduruldu'}
              </button>
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="px-3 py-2 bg-cyan-600 text-white rounded-md text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '⏳' : '🔄'} Yenile
              </button>
            </div>
          </div>
          <p className="text-gray-400">Sistem yönetimi ve kullanıcı kontrolü</p>
        </div>

        {/* Tab Navigasyonu */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FaChartBar className="inline mr-2" />
              Genel Bakış
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FaUsers className="inline mr-2" />
              Kullanıcılar
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FaCog className="inline mr-2" />
              Sistem Ayarları
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:bg-gray-750 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 group ${isLoading ? 'animate-pulse' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <FaUsers className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Toplam Kullanıcı</p>
                      <p className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">{stats.totalUsers}</p>
                    </div>
                  </div>
                  {autoRefresh && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              
              <div className={`bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:bg-gray-750 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 group ${isLoading ? 'animate-pulse' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <FaCheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Doğrulanmış</p>
                      <p className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">{stats.verifiedUsers}</p>
                    </div>
                  </div>
                  {autoRefresh && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              
              <div className={`bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:bg-gray-750 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 group ${isLoading ? 'animate-pulse' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <FaUserShield className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Admin</p>
                      <p className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors">{stats.adminUsers}</p>
                    </div>
                  </div>
                  {autoRefresh && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              
              <div className={`bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:bg-gray-750 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 group ${isLoading ? 'animate-pulse' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <FaClipboard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Son 7 Gün</p>
                      <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.recentRegistrations}</p>
                    </div>
                  </div>
                  {autoRefresh && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Son Kayıtlar */}
            <div className={`bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-gray-600 hover:shadow-lg ${isLoading ? 'animate-pulse' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mr-3">
                    <FaUsers className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Son Kayıtlar</h3>
                </div>
                <div className="flex items-center space-x-3">
                  {autoRefresh && (
                    <div className="flex items-center text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                      Canlı
                    </div>
                  )}
                  <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">
                    Son {users.length > 5 ? 5 : users.length} kayıt
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {users.length > 0 ? (
                  users.slice(-5).reverse().map((user, index) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-200 border border-transparent hover:border-gray-500/50 group"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <span className="text-sm font-medium text-white">
                              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{user.name || 'İsimsiz'}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          user.role === 'ADMIN' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-gray-600/50 text-gray-300 border border-gray-500/30'
                        }`}>
                          {user.role}
                        </span>
                        {user.isEmailVerified ? (
                          <FaCheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <FaExclamationTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <FaDatabase className="mx-auto h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Henüz kayıt bulunamadı</p>
                    <p className="text-sm mt-1">Yeni kullanıcı kayıtları burada görünecek</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sistem Aktiviteleri */}
            <div className={`bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-gray-600 hover:shadow-lg ${isLoading ? 'animate-pulse' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mr-3">
                    <FaClipboard className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Sistem Aktiviteleri</h3>
                </div>
                <div className="flex items-center space-x-3">
                  {autoRefresh && (
                    <div className="flex items-center text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                      Canlı
                    </div>
                  )}
                  <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">
                    Son {activities.length} aktivite
                  </span>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-200 border border-transparent hover:border-gray-500/50 group"
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'user_registered' && (
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                        )}
                        {activity.type === 'role_changed' && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                        )}
                        {activity.type === 'user_login' && (
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                        )}
                        {activity.type === 'user_deleted' && (
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white group-hover:text-gray-200 transition-colors leading-relaxed">{activity.message}</p>
                        <p className="text-xs text-gray-400 mt-1 bg-gray-800 inline-block px-2 py-1 rounded">
                          {activity.timestamp.toLocaleString('tr-TR')}
        </p>
      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <FaClipboard className="mx-auto h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Henüz aktivite bulunamadı</p>
                    <p className="text-sm mt-1">Sistem aktiviteleri burada görünecek</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
            <div className="px-6 py-5 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mr-3">
                    <FaUsers className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Kullanıcı Yönetimi</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                    {users.length} kullanıcı
                  </span>
                  {autoRefresh && (
                    <div className="flex items-center text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                      Canlı
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaUsers className="h-4 w-4 mr-2 text-cyan-500" />
                        Kullanıcı
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaUserShield className="h-4 w-4 mr-2 text-red-500" />
                        Rol
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaCheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Durum
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaClipboard className="h-4 w-4 mr-2 text-blue-500" />
                        Kayıt Tarihi
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {users.map((userData, index) => (
                    <tr 
                      key={userData.id} 
                      className="hover:bg-gray-700/50 transition-all duration-200 group"
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                              <span className="text-sm font-bold text-white">
                                {userData.name?.charAt(0).toUpperCase() || userData.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                              {userData.name || 'İsimsiz'}
                            </div>
                            <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                              {userData.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border ${
                          userData.role === 'ADMIN' 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/20' 
                            : 'bg-gray-600/50 text-gray-300 border-gray-500/30'
                        }`}>
                          {userData.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full border ${
                            userData.isEmailVerified 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-lg shadow-green-500/20' 
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/20'
                          }`}>
                            {userData.isEmailVerified ? (
                              <>
                                <FaCheckCircle className="w-3 h-3 mr-1" />
                                Doğrulanmış
                              </>
                            ) : (
                              <>
                                <FaExclamationTriangle className="w-3 h-3 mr-1" />
                                Beklemede
                              </>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-lg">
                          {new Date(userData.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <select
                            value={userData.role}
                            onChange={(e) => updateUserRole(userData.id, e.target.value)}
                            className="bg-gray-700 border border-gray-600 text-white text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={userData.id === user?.id}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <button
                            onClick={() => deleteUser(userData.id)}
                            disabled={userData.id === user?.id}
                            className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Empty State */}
            {users.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <FaDatabase className="mx-auto h-20 w-20 mb-6 opacity-30" />
                <p className="text-xl font-medium text-white mb-2">Henüz kullanıcı bulunamadı</p>
                <p className="text-sm">Yeni kullanıcı kayıtları burada görünecek</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Sistem Ayarları */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mr-3">
                  <FaCog className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Sistem Ayarları</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-600/50 hover:bg-gray-700 transition-all duration-200 group">
                  <div>
                    <h4 className="text-white font-medium group-hover:text-gray-100">E-posta Doğrulama</h4>
                    <p className="text-gray-400 text-sm mt-1">Yeni kullanıcıların e-posta doğrulaması yapması gereksin</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600 shadow-lg"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-600/50 hover:bg-gray-700 transition-all duration-200 group">
                  <div>
                    <h4 className="text-white font-medium group-hover:text-gray-100">Otomatik Yedekleme</h4>
                    <p className="text-gray-400 text-sm mt-1">Veritabanının günlük yedeklemesi</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600 shadow-lg"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-600/50 hover:bg-gray-700 transition-all duration-200 group">
                  <div>
                    <h4 className="text-white font-medium group-hover:text-gray-100">Kayıt İzni</h4>
                    <p className="text-gray-400 text-sm mt-1">Yeni kullanıcı kayıtlarına izin ver</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600 shadow-lg"></div>
                  </label>
                </div>
              </div>
      </div>

            {/* Tehlikeli İşlemler */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg mr-3">
                  <FaExclamationTriangle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Tehlikeli İşlemler</h3>
              </div>
              <div className="space-y-4">
                <button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/25 hover:scale-[1.02] flex items-center justify-center group">
                  <FaDatabase className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                  Tüm Cache'leri Temizle
                </button>
                <button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] flex items-center justify-center group">
                  <FaClipboard className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                  Sistem Loglarını Temizle
                </button>
                <button className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-600/25 hover:scale-[1.02] flex items-center justify-center group border border-red-500/30">
                  <FaExclamationTriangle className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                  Veritabanını Yeniden Oluştur
                </button>
              </div>
              
              {/* Uyarı Mesajı */}
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-start">
                  <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-400 font-medium mb-1">Dikkat!</h4>
                    <p className="text-red-300/80 text-sm">Bu işlemler geri alınamaz. Devam etmeden önce tüm verilerin yedeklendiğinden emin olun.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 