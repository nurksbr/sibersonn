import { NextRequest, NextResponse } from 'next/server';
import { sendDirectMail } from '@/lib/email-direct';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Direkt mail test isteği alındı');
    
    // Test mail gönderme
    const result = await sendDirectMail(
      'mikailsun21@gmail.com',
      'Direkt Test E-postası',
      'Bu bir direkt test e-postasıdır. Alternative mail servisi kullanılarak gönderilmiştir.'
    );
    
    if (result.success) {
      console.log('API: Direkt mail başarıyla gönderildi', result);
      return NextResponse.json({ 
        success: true, 
        message: 'Direkt test e-postası başarıyla gönderildi', 
        messageId: result.messageId ? String(result.messageId) : undefined 
      });
    } else {
      console.error('API: Direkt mail gönderimi başarısız', result.error);
      // Hata objesini güvenli bir şekilde string'e çevir
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
    console.error('API: Direkt mail gönderimi sırasında hata oluştu:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Bilinmeyen bir hata oluştu';
      
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
} 