import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcrypt'

// Admin kullanıcıları listesi
const ADMIN_EMAILS = [
  'fevziyenurksbr1@gmail.com',
  'fevziyenur@icloud.com',
  'demo@cyberly.com',
  'admin@example.com'
];

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  pages: {
    signIn: '/giris',
    error: '/auth-error',  // Hata sayfası
    signOut: '/cikis'
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'sibergercek-gizli-anahtar-super-guvenli-2025',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Şifre', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials')
            return null
          }

          console.log('Attempting to authenticate user:', credentials.email)

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.error('User not found:', credentials.email)
            return null
          }

          console.log('User found, checking password...')

          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            console.error('Invalid password for user:', credentials.email)
            return null
          }

          console.log('Authentication successful for user:', credentials.email)

          // Admin kontrolü - hem veritabanından hem sabit listeden
          const isAdmin = user.isAdmin || ADMIN_EMAILS.includes(user.email);
          
          console.log(`Admin durumu: ${user.email} -> ${isAdmin} (DB: ${user.isAdmin}, Liste: ${ADMIN_EMAILS.includes(user.email)})`);

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            role: isAdmin ? 'ADMIN' : (user.role || 'USER'),
            isAdmin: isAdmin
          }
        } catch (error) {
          console.error('Auth error details:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async session({ token, session }) {
      try {
        if (token && session.user) {
          session.user.id = token.id
          session.user.name = token.name || session.user.email?.split('@')[0]
          session.user.email = token.email || session.user.email
          session.user.role = token.role
          session.user.isAdmin = token.isAdmin
          
          console.log(`Session callback - User: ${session.user.email}, isAdmin: ${session.user.isAdmin}`);
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
    async jwt({ token, user }) {
      try {
        // Kullanıcı bilgisi varsa token'a ekle
        if (user) {
          token.id = user.id
          token.role = user.role
          token.isAdmin = user.isAdmin
          
          console.log(`JWT callback - User: ${user.email}, isAdmin: ${user.isAdmin}`);
          return token
        }

        // Eğer yeni oturum değilse token'ı güncellemeye gerek yok
        if (token.exp && typeof token.exp === 'number' && Date.now() < (token.exp * 1000) - 5 * 60 * 1000) {
          return token
        }

        // Token süresi dolmak üzere, veritabanından kullanıcı bilgilerini yenile
        if (token.email) {
          const dbUser = await prisma.user.findFirst({
            where: {
              email: token.email
            }
          })

          if (dbUser) {
            token.id = dbUser.id
            token.name = dbUser.name || dbUser.email.split('@')[0]
            token.email = dbUser.email
            token.role = dbUser.role || 'USER'
            // Admin kontrolü - hem veritabanından hem sabit listeden
            const isAdmin = dbUser.isAdmin || ADMIN_EMAILS.includes(dbUser.email);
            token.isAdmin = isAdmin
            
            console.log(`JWT refresh - User: ${dbUser.email}, isAdmin: ${isAdmin}`);
          }
        }

        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    }
  },
  // Add error handling
  events: {
    async signIn({ user, account, profile }) {
      console.log('User signed in:', user.email, 'isAdmin:', user.isAdmin)
    },
    async signOut({ session, token }) {
      console.log('User signed out')
    },
    async session({ session, token }) {
      // Silent session events
    }
  }
}