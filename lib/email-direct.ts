import nodemailer from 'nodemailer';

// Direkt mail gönderme - SSL hatalarını handle eden gelişmiş versiyon
export async function sendDirectMail(to: string, subject: string, content: string) {
  console.log('Direkt mail gönderme deneniyor:', { to, subject });
  
  try {
    // Ana Gmail servisi transport yapılandırması
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'fevziyenurksbr1@gmail.com',
        pass: 'hjob mgyj cwwv yptn'
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS'
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });
    
    // Mail içeriği
    const mailOptions = {
      from: 'CYBERLY <fevziyenurksbr1@gmail.com>',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">CYBERLY - ${subject}</h2>
          <p>Merhaba,</p>
          <p>${content}</p>
          <p>Gönderen: fevziyenurksbr1@gmail.com</p>
          <p>Alıcı: ${to}</p>
          <p>Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')}</p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
            <p>CYBERLY Siber Güvenlik Platformu</p>
          </div>
        </div>
      `
    };
    
    // Mail gönderme
    const info = await transporter.sendMail(mailOptions);
    console.log('Direkt mail başarıyla gönderildi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Direkt mail gönderme hatası:', error);
    if (error instanceof Error) {
      console.error('Hata mesajı:', error.message);
      console.error('Hata stack:', error.stack);
    }
    return { success: false, error };
  }
} 