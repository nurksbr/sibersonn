import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateVerificationToken, sendModernVerificationEmail } from '@/lib/email-verification';

// Email validation schema
const resendSchema = z.object({
  email: z.string()
    .email({ message: 'Geçerli bir e-posta adresi giriniz' })
    .toLowerCase()
    .transform(email => email.trim()),
});

export async function POST(request: NextRequest) {
  console.log('API: Doğrulama e-postası yeniden gönderme endpoint çağrıldı');
  
  try {
    // Parse request body
    let body;
    try {
      const text = await request.text();
      console.log('API: Ham istek gövdesi:', text);
      body = JSON.parse(text);
      console.log('API: İstek gövdesi başarıyla parse edildi:', body);
    } catch (parseError) {
      console.error('API: JSON parse hatası:', parseError);
      return NextResponse.json(
        { error: 'Geçersiz istek formatı' },
        { status: 400 }
      );
    }
    
    // Validate email
    const result = resendSchema.safeParse(body);
    if (!result.success) {
      console.log('API: E-posta doğrulama hatası:', result.error.issues);
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi giriniz' },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    // Find user by email
    console.log('API: Kullanıcı aranıyor:', email);
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          isEmailVerified: true,
          emailVerificationExpires: true
        }
      });
      
      if (!user) {
        console.log('API: Kullanıcı bulunamadı:', email);
        return NextResponse.json(
          { error: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı' },
          { status: 404 }
        );
      }
      
      // Check if already verified
      if (user.isEmailVerified) {
        console.log('API: Kullanıcı zaten doğrulanmış:', email);
        return NextResponse.json(
          { message: 'E-posta adresiniz zaten doğrulanmış. Giriş yapabilirsiniz.' },
          { status: 200 }
        );
      }
      
      console.log('API: Kullanıcı bulundu, yeni doğrulama token\'ı oluşturuluyor');
    } catch (dbLookupError) {
      console.error('API: Kullanıcı arama sırasında veritabanı hatası:', dbLookupError);
      return NextResponse.json(
        { error: 'Veritabanı hatası: ' + String(dbLookupError) },
        { status: 500 }
      );
    }
    
    // Generate new verification token
    const verificationData = generateVerificationToken(72); // 72 hours validity
    
    try {
      // Update user with new verification token
      await prisma.user.update({
        where: { email },
        data: {
          emailVerificationToken: verificationData.hashedToken,
          emailVerificationExpires: verificationData.expiresAt,
        }
      });
      
      console.log('API: Kullanıcı yeni token ile güncellendi');
      
      // Send verification email
      try {
        console.log('API: Doğrulama e-postası gönderiliyor...');
        
        const user = await prisma.user.findUnique({
          where: { email },
          select: { name: true }
        });
        
        const emailResult = await sendModernVerificationEmail(
          email,
          user?.name || email.split('@')[0],
          verificationData.token // Raw token for email
        );
        
        console.log('API: E-posta gönderme sonucu:', emailResult);
        
        if (!emailResult.success) {
          console.error('API: E-posta gönderilemedi:', emailResult.error);
          return NextResponse.json(
            { error: 'Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.' },
            { status: 500 }
          );
        } else {
          console.log('API: Doğrulama e-postası başarıyla gönderildi:', email);
        }
      } catch (error) {
        console.error('API: E-posta gönderme hatası:', error);
        return NextResponse.json(
          { error: 'E-posta gönderilirken bir hata oluştu.' },
          { status: 500 }
        );
      }
            
      // Return success response
      return NextResponse.json(
        { 
          message: 'Doğrulama e-postası başarıyla gönderildi! Lütfen e-posta kutunuzu kontrol edin.',
          instructions: 'E-postada bulunan bağlantıya tıklayarak hesabınızı doğrulayın.'
        },
        { status: 200 }
      );
      
    } catch (updateError) {
      console.error('API: Kullanıcı güncelleme hatası:', updateError);
      return NextResponse.json(
        { error: 'Kullanıcı güncellenirken veritabanı hatası oluştu', details: String(updateError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Doğrulama e-postası yeniden gönderme genel hatası:', error);
    return NextResponse.json(
      { error: 'E-posta gönderilirken bir hata oluştu', details: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
