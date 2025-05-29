import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Korumalı rotalar (genel kullanıcı)
const protectedRoutes = ['/ayarlar', '/panel', '/profilim', '/egitimlerim'];

// Admin rotalar
const adminRoutes = ['/admin-panel'];

// Admin kullanıcıları listesi (hardcoded fallback)
const ADMIN_EMAILS = [
  'fevziyenurksbr1@gmail.com',
  'fevziyenur@icloud.com',
  'demo@cyberly.com',
  'admin@example.com'
];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  console.log(`🔍 MIDDLEWARE BAŞLADI - URL: ${url.href}`);
  console.log(`📍 Yol: ${pathname}`);

  // Force HTTP in development to prevent SSL issues
  if (process.env.NODE_ENV === 'development' && url.protocol === 'https:') {
    url.protocol = 'http:';
    return NextResponse.redirect(url);
  }

  // NextAuth session token'ını al
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || 'sibergercek-gizli-anahtar-super-guvenli-2025'
  });

  console.log(`🔑 TOKEN DURUMU:`);
  console.log(`  - Token var: ${!!token}`);
  console.log(`  - Email: ${token?.email || 'N/A'}`);
  console.log(`  - Role: ${token?.role || 'N/A'}`);
  console.log(`  - isAdmin (token): ${token?.isAdmin}`);
  console.log(`  - Email admin listesinde: ${token?.email ? ADMIN_EMAILS.includes(token.email) : false}`);

  // Admin paneli kontrolü
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    console.log(`🚨 ADMIN PANEL ERİŞİMİ TESPİT EDİLDİ: ${pathname}`);
    
    if (!token) {
      console.log('❌ Token bulunamadı, giriş sayfasına yönlendiriliyor');
      url.pathname = '/giris';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Çifte admin kontrolü
    const isTokenAdmin = token.isAdmin === true;
    const isEmailAdmin = token.email ? ADMIN_EMAILS.includes(token.email) : false;
    const isAdmin = isTokenAdmin || isEmailAdmin;

    console.log(`🔐 ADMIN KONTROL SONUÇLARI:`);
    console.log(`  - Token isAdmin: ${isTokenAdmin}`);
    console.log(`  - Email listede: ${isEmailAdmin}`);
    console.log(`  - Final isAdmin: ${isAdmin}`);

    if (!isAdmin) {
      console.log(`❌ Kullanıcı ${token.email} admin değil, ana sayfaya yönlendiriliyor`);
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    console.log(`✅ Admin paneli erişimi ONAYLANDI: ${token.email}`);
    return NextResponse.next();
  }

  // Genel korumalı rotalar kontrolü
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      console.log(`❌ Korumalı rota erişimi engellendi: ${pathname}`);
      url.pathname = '/giris';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    console.log(`✅ Korumalı rota erişimi onaylandı: ${token.email} -> ${pathname}`);
    return NextResponse.next();
  }

  // Diğer tüm rotalar için devam et
  console.log(`➡️ Genel rota, devam ediliyor: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};