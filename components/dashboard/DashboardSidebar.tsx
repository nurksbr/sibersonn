'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: '📊'
  },
  {
    title: 'Profil',
    href: '/dashboard/profile',
    icon: '👤'
  },
  {
    title: 'Eğitimler',
    href: '/dashboard/courses',
    icon: '📚'
  },
  {
    title: 'Sertifikalar',
    href: '/dashboard/certificates',
    icon: '🏆'
  },
  {
    title: 'Ayarlar',
    href: '/dashboard/settings',
    icon: '⚙️'
  }
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">Dashboard</h2>
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
} 