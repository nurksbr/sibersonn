import { randomBytes, createHash } from 'crypto';
import { sendEmail } from './email';

export interface VerificationToken {
  token: string;
  hashedToken: string;
  expiresAt: Date;
}

/**
 * Güvenli doğrulama token'ı oluşturur
 * @param expirationHours Token'ın geçerli olacağı saat sayısı (varsayılan: 72)
 * @returns Token bilgileri
 */
export function generateVerificationToken(expirationHours: number = 72): VerificationToken {
  // 32 byte rastgele token oluştur
  const token = randomBytes(32).toString('hex');
  
  // Token'ı SHA-256 ile hashle (veritabanında saklayacağımız)
  const hashedToken = createHash('sha256').update(token).digest('hex');
  
  // Son kullanma tarihi
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);
  
  return {
    token, // Kullanıcıya gönderilecek
    hashedToken, // Veritabanında saklanacak
    expiresAt
  };
}

/**
 * Doğrulama token'ını hashleyerek karşılaştırma yapar
 * @param token Kullanıcıdan gelen token
 * @param hashedToken Veritabanında saklanan hash
 * @returns Token geçerli mi?
 */
export function verifyToken(token: string, hashedToken: string): boolean {
  if (!token || !hashedToken) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Token veya hashedToken eksik');
    }
    return false;
  }
  
  try {
    const inputHash = createHash('sha256').update(token).digest('hex');
    const isValid = inputHash === hashedToken;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Token doğrulama:', { 
        tokenLength: token.length, 
        hashedTokenLength: hashedToken.length,
        isValid,
        inputHashSample: inputHash.substring(0, 10) + '...',
        storedHashSample: hashedToken.substring(0, 10) + '...'
      });
    }
    
    return isValid;
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return false;
  }
}

/**
 * Modern ve güvenli doğrulama e-postası gönderir
 * @param email Alıcı e-posta adresi
 * @param name Kullanıcı adı
 * @param verificationToken Doğrulama token'ı
 * @returns E-posta gönderim sonucu
 */
export async function sendModernVerificationEmail(
  email: string, 
  name: string, 
  verificationToken: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-verify?token=${verificationToken}`;
  
  const currentYear = new Date().getFullYear();
  
  const emailHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-posta Doğrulama - CYBERLY</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 40px 30px; text-align: center;">
      <div style="display: inline-block; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; backdrop-filter: blur(10px);">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">CYBERLY</h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Siber Güvenlik Platformu</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Merhaba ${name}! 👋</h2>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        <strong>CYBERLY</strong> ailesine hoş geldiniz! Hesabınızı aktifleştirmek için e-posta adresinizi doğrulamanız gerekiyor.
      </p>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #06b6d4;">
        <p style="color: #334155; margin: 0 0 15px 0; font-size: 14px; font-weight: 500;">
          🔐 <strong>Güvenlik Önemli:</strong> Bu link sadece size özeldir ve 72 saat geçerlidir.
        </p>
        <p style="color: #64748b; margin: 0; font-size: 13px;">
          Bu işlemi siz yapmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.
        </p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4); transition: all 0.3s ease;">
          ✉️ E-posta Adresimi Doğrula
        </a>
      </div>
      
      <!-- Alternative Link -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 10px 0;">
          Butona tıklayamıyorsanız, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırın:
        </p>
        <p style="color: #06b6d4; font-size: 12px; word-break: break-all; margin: 0;">
          ${verificationUrl}
        </p>
      </div>
      
      <!-- Features -->
      <div style="margin: 40px 0 20px 0;">
        <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
          CYBERLY ile neler yapabilirsiniz?
        </h3>
        <div style="display: grid; gap: 15px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; background: #dcfdf7; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
              🛡️
            </div>
            <span style="color: #475569; font-size: 14px;">Profesyonel siber güvenlik eğitimleri</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; background: #dbeafe; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
              📚
            </div>
            <span style="color: #475569; font-size: 14px;">Güncel tehdit analizi ve raporlar</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; background: #fef3c7; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
              🎯
            </div>
            <span style="color: #475569; font-size: 14px;">Kişiselleştirilmiş öğrenme deneyimi</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 10px 0;">
        © ${currentYear} CYBERLY Siber Güvenlik Platformu. Tüm hakları saklıdır.
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        Bu e-posta ${new Date().toLocaleString('tr-TR', { 
          dateStyle: 'full', 
          timeStyle: 'short' 
        })} tarihinde gönderilmiştir.
      </p>
    </div>
  </div>
</body>
</html>`;

  return await sendEmail({
    to: email,
    subject: `🔐 CYBERLY - E-posta Adresinizi Doğrulayın`,
    html: emailHtml
  });
}
