import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Özel test mail gönderme isteği alındı');
    
    // İstek gövdesini al
    const body = await request.json();
    const { to, subject, content } = body;
    
    // Zorunlu parametreleri kontrol et
    if (!to) {
      return NextResponse.json({ 
        success: false, 
        error: 'Alıcı e-posta adresi gereklidir' 
      }, { status: 400 });
    }
    
    // Test e-postası gönder
    const result = await sendEmail({
      to: to,
      subject: subject || 'CYBERLY - Test E-postası',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">CYBERLY Test E-postası</h2>
          <p>Merhaba,</p>
          ${content ? `<p>${content}</p>` : '<p>Bu bir test e-postasıdır. Mail sunucusu başarıyla çalışıyor!</p>'}
          <p>Gönderen: fevziyenurksbr1@gmail.com</p>
          <p>Alıcı: ${to}</p>
          <p>Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')}</p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
            <p>CYBERLY Siber Güvenlik Platformu</p>
          </div>
        </div>
      `
    });
    
    if (result.success) {
      console.log('API: Özel test mail başarıyla gönderildi', result);
      return NextResponse.json({ 
        success: true, 
        message: `Test e-postası başarıyla gönderildi: ${to}`, 
        messageId: result.messageId ? String(result.messageId) : undefined 
      });
    } else {
      console.error('API: Özel test mail gönderimi başarısız', result.error);
      const errorMessage = result.error instanceof Error 
        ? result.error.message 
        : (typeof result.error === 'string' 
            ? result.error 
            : 'Bilinmeyen bir hata oluştu');
            
      return NextResponse.json({ 
        success: false, 
        error: errorMessage 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API: Özel test mail gönderimi sırasında hata oluştu:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Bilinmeyen bir hata oluştu';
      
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
} 