import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/email-verification';

export async function GET(request: NextRequest) {
  try {
    // Token al
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Doğrulama tokeni eksik' },
        { status: 400 }
      );
    }    console.log('API: E-posta doğrulama isteği alındı, token:', token);

    // Aktif token'ları olan tüm kullanıcıları bul
    const usersWithTokens = await prisma.user.findMany({
      where: {
        emailVerificationToken: { not: null },
        emailVerificationExpires: {
          gt: new Date() // Token süresi dolmamış olmalı
        },
        isEmailVerified: false // Henüz doğrulanmamış olmalı
      }
    });

    // Gelen token'ı hash'leyerek karşılaştır
    let matchedUser = null;
    for (const user of usersWithTokens) {
      if (user.emailVerificationToken && verifyToken(token, user.emailVerificationToken)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      console.log('API: Geçersiz veya süresi dolmuş token');
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş doğrulama bağlantısı' },
        { status: 400 }
      );
    }

    console.log('API: Kullanıcı bulundu, e-posta doğrulanıyor:', matchedUser.email);    // Kullanıcıyı doğrulanmış olarak işaretle
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null, // Token artık gerekli değil
        emailVerificationExpires: null // Bitiş tarihi de gerekli değil
      }
    });

    console.log('API: E-posta başarıyla doğrulandı:', matchedUser.email);

    // Başarı mesajı döndür (redirect yerine JSON response)
    return NextResponse.json(
      { 
        message: 'E-posta adresiniz başarıyla doğrulandı! Artık sisteme giriş yapabilirsiniz.',
        verified: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API: E-posta doğrulama hatası:', error);
    return NextResponse.json(
      { error: 'Doğrulama işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 