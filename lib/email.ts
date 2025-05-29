import nodemailer from 'nodemailer'

type EmailPayload = {
  to: string
  subject: string
  html: string
}

// E-posta gönderme için transporter yapılandırması
const getTransporter = () => {
  console.log('Transporter oluşturuluyor, gelişmiş SSL/TLS ayarları ile...');
  
  // Öncelikle en güvenilir ayarları kullan - port 587 + STARTTLS
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // 587 portu için false olmalı
    auth: {
      user: 'fevziyenurksbr1@gmail.com',
      pass: 'hjob mgyj cwwv yptn',
    },
    // Daha agresif SSL/TLS ayarları
    tls: {
      rejectUnauthorized: false,
      servername: 'smtp.gmail.com',
      // OpenSSL için özel ayarlar
      secureProtocol: 'TLSv1_2_method',
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3'
    },
    // Bağlantı zaman aşımı ayarları
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    // Debug için
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });
};

// E-posta gönderme fonksiyonu
export const sendEmail = async (data: EmailPayload) => {
  try {
    // Varsayılan gönderen e-posta adresi
    const emailFrom = process.env.EMAIL_FROM || 'CYBERLY <fevziyenurksbr1@gmail.com>';
    
    // E-posta ayarlarını kontrol et
    if (!emailFrom) {
      console.error('EMAIL_FROM ayarı eksik');
      return { success: false, error: 'EMAIL_FROM ayarı eksik' };
    }

    console.log('E-posta gönderiliyor:', {
      to: data.to,
      subject: data.subject,
      from: emailFrom
    });

    // Ana transporter ile dene
    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: emailFrom,
        ...data,
      });
      
      console.log(`E-posta başarıyla gönderildi: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
      
    } catch (primaryError) {
      console.error('Ana transporter başarısız, alternatif deneniyor:', primaryError);
      
      // Alternatif port 465 (SSL) ile dene
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL
        auth: {
          user: 'fevziyenurksbr1@gmail.com',
          pass: 'hjob mgyj cwwv yptn',
        },
        tls: {
          rejectUnauthorized: false,
          servername: 'smtp.gmail.com'
        }
      });
      
      try {
        const info = await fallbackTransporter.sendMail({
          from: emailFrom,
          ...data,
        });
        
        console.log(`Fallback ile e-posta gönderildi: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
        
      } catch (fallbackError) {
        console.error('Fallback da başarısız:', fallbackError);
        throw fallbackError;
      }
    }
    
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    if (error instanceof Error) {
      console.error('Hata mesajı:', error.message);
      console.error('Hata stack:', error.stack);
    }
    return { success: false, error };
  }
}

// Doğrulama e-postası gönderme
export const sendVerificationEmail = async (email: string, verificationUrl: string, name?: string) => {
  console.log('Doğrulama e-postası gönderiliyor:', email, verificationUrl);
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; text-align: center;">E-posta Adresinizi Doğrulayın</h2>
      <p>Merhaba ${name || 'Değerli Kullanıcı'},</p>
      <p>CYBERLY'ye kayıt olduğunuz için teşekkür ederiz. Hesabınızı etkinleştirmek için lütfen aşağıdaki bağlantıya tıklayın:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">E-posta Adresimi Doğrula</a>
      </div>
      <p>Bu bağlantı 24 saat boyunca geçerli olacaktır.</p>
      <p>Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın veya bize bildirin.</p>
      <p>Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')}</p>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        <p>CYBERLY Siber Güvenlik Platformu</p>
      </div>
    </div>
  `
  
  return await sendEmail({
    to: email,
    subject: 'CYBERLY - E-posta Adresinizi Doğrulayın',
    html: emailContent
  });
} 