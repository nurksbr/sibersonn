import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Test mail gönderme isteği alındı');

    // Güvenlik kontrolü
    const csrfToken = request.headers.get('x-csrf-token');
    
    try {
      // Test e-postası gönder
      const result = await sendEmail({
        to: 'mikailsun21@gmail.com',
        subject: 'CYBERLY - Test E-postası',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">CYBERLY Test E-postası</h2>
            <p>Merhaba,</p>
            <p>Bu bir test e-postasıdır. Mail sunucusu başarıyla çalışıyor!</p>
            <p>Gönderen: fevziyenurksbr1@gmail.com</p>
            <p>Alıcı: mikailsun21@gmail.com</p>
            <p>Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')}</p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
              <p>CYBERLY Siber Güvenlik Platformu</p>
            </div>
          </div>
        `
      });
      
      if (result.success) {
        console.log('API: Test mail başarıyla gönderildi', result);
        return NextResponse.json({ 
          success: true, 
          message: 'Test e-postası başarıyla gönderildi', 
          messageId: result.messageId ? String(result.messageId) : undefined 
        });
      } else {
        console.error('API: Test mail gönderimi başarısız', result.error);
        // Hata objesini güvenli bir şekilde string'e çevir
        const errorMessage = result.error instanceof Error 
          ? result.error.message 
          : (typeof result.error === 'string' 
              ? result.error 
              : 'Bilinmeyen bir hata oluştu');
              
        // Hata ayrıntılarını loglayalım
        console.error('Hata detayları:', JSON.stringify(result.error, Object.getOwnPropertyNames(result.error)));
        
        return NextResponse.json({ 
          success: false, 
          error: errorMessage 
        }, { status: 500 });
      }
    } catch (mailError) {
      // E-posta gönderme hatası
      console.error('API: Mail gönderme işlemi sırasında hata:', mailError);
      
      // SSL/TLS hatası mı?
      let errorMessage = 'E-posta gönderme işlemi başarısız oldu';
      const errorStr = String(mailError);
      
      if (errorStr.includes('SSL routines') || errorStr.includes('wrong version')) {
        errorMessage = 'Mail sunucusu SSL/TLS bağlantı hatası. Sunucu yapılandırması kontrol edilmeli.';
      } else if (errorStr.includes('ECONNREFUSED')) {
        errorMessage = 'Mail sunucusuna bağlanılamadı. Sunucu adresi veya port numarası hatalı olabilir.';
      } else if (errorStr.includes('ETIMEDOUT')) {
        errorMessage = 'Mail sunucusu yanıt vermiyor. Sunucu çalışmıyor olabilir.';
      } else if (errorStr.includes('Authentication')) {
        errorMessage = 'Mail sunucusu kimlik doğrulama hatası. Kullanıcı adı veya şifre hatalı.';
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: mailError instanceof Error ? mailError.message : String(mailError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API: Test mail gönderimi sırasında genel hata:', error);
    // Hata objesini string'e çevir
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Bilinmeyen bir hata oluştu';
      
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
} 