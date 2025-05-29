import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@/prisma/generated/client';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { generateVerificationToken, sendModernVerificationEmail } from '@/lib/email-verification';

// Gelişmiş kayıt şeması doğrulama
const registerSchema = z.object({
  name: z.string()
    .min(2, { message: 'Ad en az 2 karakter olmalıdır' })
    .max(50, { message: 'Ad en fazla 50 karakter olabilir' })
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, { message: 'Ad sadece harf içerebilir' }),
  email: z.string()
    .email({ message: 'Geçerli bir e-posta adresi giriniz' })
    .toLowerCase()
    .transform(email => email.trim()),
  password: z.string()
    .min(8, { message: 'Şifre en az 8 karakter olmalıdır' })
    .regex(/(?=.*[a-z])/, { message: 'Şifre en az bir küçük harf içermelidir' })
    .regex(/(?=.*[A-Z])/, { message: 'Şifre en az bir büyük harf içermelidir' })
    .regex(/(?=.*[0-9])/, { message: 'Şifre en az bir rakam içermelidir' })
    .regex(/(?=.*[!@#$%^&*.])/, { message: 'Şifre en az bir özel karakter (!@#$%^&*.) içermelidir' }),
});

export async function POST(request: NextRequest) {
  console.log('API: Kayıt endpoint çağrıldı');
  
  try {
    // İsteği JSON olarak parse et
    let body;
    try {
      const text = await request.text();
      console.log('API: Ham kayıt isteği:', text);
      body = JSON.parse(text);
      console.log('API: İstek gövdesi başarıyla parse edildi:', body);
    } catch (parseError) {
      console.error('API: JSON parse hatası:', parseError);
      return NextResponse.json(
        { error: 'Geçersiz istek formatı' },
        { status: 400 }
      );
    }
    
    // Gelen verileri doğrula
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      console.log('API: Doğrulama hatası:', result.error.issues);
      return NextResponse.json(
        { error: 'Doğrulama hatası', issues: result.error.issues },
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;
    
    // E-posta adresi zaten kullanılıyor mu kontrol et
    console.log('API: E-posta kontrolü yapılıyor:', email);
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        console.log('API: Bu e-posta zaten kullanımda:', email);
        return NextResponse.json(
          { error: 'Bu e-posta adresi zaten kullanılıyor' },
          { status: 400 }
        );
      }
      
      console.log('API: E-posta kullanılabilir, kullanıcı oluşturuluyor');
    } catch (dbLookupError) {
      console.error('API: E-posta kontrolü sırasında veritabanı hatası:', dbLookupError);
      return NextResponse.json(
        { error: 'Veritabanı hatası: ' + String(dbLookupError) },
        { status: 500 }
      );
    }
    
    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Güvenli doğrulama token'ı oluştur
    const verificationData = generateVerificationToken(72); // 72 saat geçerli
    
    // Test için fevziyenurksbr1@gmail.com'a admin yetkisi ver
    const userRole = email === 'fevziyenurksbr1@gmail.com' ? 'ADMIN' : 'USER';
    
    // Kullanıcıyı oluştur
    console.log('API: Veritabanına kullanıcı kaydediliyor', {
      name, email, role: userRole
    });
    
    // Veritabanı şeması için role değeri enum olmalı
    const roleEnum = userRole === 'ADMIN' ? 'ADMIN' : 'USER';
    
    try {
      // Kullanıcı oluşturma - token bilgilerini de dahil et
      const userData = {
        name,
        email,
        password: hashedPassword,
        role: roleEnum as Role, // Role enum tipini kullan
        emailVerificationToken: verificationData.hashedToken, // Hash'lenmiş token'ı kaydet
        emailVerificationExpires: verificationData.expiresAt, // Geçerlilik süresi
        // isEmailVerified varsayılan olarak false
        backupCodes: JSON.stringify([]) // SQLite için string tipinde boş array
      };

      console.log('API: Kullanıcı verisi hazırlandı:', JSON.stringify({...userData, password: '[HIDDEN]', emailVerificationToken: '[HIDDEN]'}, null, 2));
      
      const user = await prisma.user.create({
        data: userData,
      });
      
      console.log('API: Kullanıcı başarıyla oluşturuldu:', user.id);
      
      // Modern doğrulama e-postası gönder
      try {
        console.log('API: Modern doğrulama e-postası gönderiliyor...');
        
        const emailResult = await sendModernVerificationEmail(
          email,
          name,
          verificationData.token // Ham token'ı e-postada kullan
        );
        
        console.log('API: E-posta gönderme sonucu:', emailResult);
        
        if (!emailResult.success) {
          console.error('API: E-posta gönderilemedi:', emailResult.error);
        } else {
          console.log('API: Modern doğrulama e-postası başarıyla gönderildi:', email);
        }
      } catch (error) {
        console.error('API: E-posta gönderme hatası:', error);
        // E-posta hatası olsa bile devam et, kullanıcı oluşturulmuş olmalı
      }
            
      // Kullanıcı bilgilerini döndür
      return NextResponse.json(
        { 
          message: 'Kullanıcı başarıyla oluşturuldu! Lütfen e-posta adresinizi kontrol ederek hesabınızı doğrulayın.',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailVerified: false
          },
          instructions: 'E-posta doğrulaması yapmadan sisteme giriş yapamazsınız.'
        },
        { status: 201 }
      );
    } catch (createError) {
      console.error('API: Kullanıcı oluşturma hatası:', createError);
      return NextResponse.json(
        { error: 'Kullanıcı oluşturulurken veritabanı hatası oluştu', details: String(createError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Kayıt genel hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulurken bir hata oluştu', details: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}