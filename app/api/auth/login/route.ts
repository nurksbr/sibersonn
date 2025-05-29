import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

// Kullanıcı tipleri
type BaseUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
};

type UserWithAlternatePasswords = BaseUser & {
  alternatePasswords?: string[];
};

type TestUser = BaseUser | UserWithAlternatePasswords;

// Test/demo kullanıcısı - gerçek üretimde kullanmayın, yalnızca test için
const TEST_USER: TestUser = {
  id: 'test123',
  email: 'test@example.com',
  name: 'Test Kullanıcı',
  password: 'password', // Artık açık metin olarak saklıyoruz
  role: 'USER'
};

// Test kullanıcıları - demo ve geliştirme için
const TEST_USERS: TestUser[] = [
  TEST_USER,
  {
    id: 'user123',
    email: 'fevziyenur@icloud.com',
    name: 'Fevziye Nur ★ ADMIN ★',
    password: 'password123',
    role: 'ADMIN',
    alternatePasswords: ['Fevziye2002', 'password'] // Alternatif şifreler
  },
  // Ek admin kullanıcısı
  {
    id: 'admin_user',
    email: 'fevziyenurksbr1@gmail.com',
    name: 'Fevziye Nur (Admin)',
    password: 'password',
    role: 'ADMIN',
    alternatePasswords: ['123456', 'admin']
  },
  // Fırat Üniversitesi kullanıcısı
  {
    id: 'user_firat',
    email: '230542021@firat.edu.tr',
    name: 'Fırat Öğrenci',
    password: 'Nur1234.',
    role: 'USER'
  },
  // Diğer test kullanıcıları - herhangi bir e-posta ile giriş yapılabilmesi için
  {
    id: 'user456',
    email: 'admin@example.com',
    name: 'Admin Kullanıcı',
    password: 'admin123',
    role: 'USER'
  },
  {
    id: 'user789',
    email: 'user@example.com',
    name: 'Normal Kullanıcı',
    password: 'user123',
    role: 'USER'
  },
  // Wildcard kullanıcı - herhangi bir e-posta ile giriş yapılabilir
  {
    id: 'generic_user',
    email: '*', // Herhangi bir e-posta
    name: 'Genel Kullanıcı',
    password: 'password', // Herkese açık şifre
    role: 'USER'
  },
  {
    id: 'admin123',
    email: 'demo@cyberly.com',
    name: 'Demo Admin',
    password: 'demo123',
    role: 'ADMIN',
    alternatePasswords: ['admin123', 'password', 'demo']
  },
];

export async function POST(request: NextRequest) {
  console.log('API: Login endpoint called');
  
  try {
    // Parse request body
    let body;
    try {
      const text = await request.text();
      console.log('API: Raw request body:', text);
      body = JSON.parse(text);
      console.log('API: Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('API: JSON parse error:', parseError);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request format', success: false }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        }
      );
    }
    
    const { email, password } = body;
    console.log('API: Login attempt:', { email, passwordProvided: !!password });

    // Validate required fields
    if (!email || !password) {
      console.log('API: Missing credentials');
      return new NextResponse(
        JSON.stringify({ error: 'Email and password are required', success: false }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // First try database authentication
    try {
      console.log('API: Looking up user in database:', email);
      
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          isEmailVerified: true,
        },
      });

      if (user) {
        console.log('API: User found in database, verifying password');
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          console.log('API: Invalid password for database user');
          return new NextResponse(
            JSON.stringify({ error: 'Invalid credentials', success: false }),
            { 
              status: 401,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }

        // E-posta doğrulama kontrolünü kaldırdık - tüm kullanıcılar giriş yapabilir
        // Check email verification - DISABLED for existing users
        // if (!user.isEmailVerified) {
        //   console.log('API: User email not verified');
        //   return new NextResponse(
        //     JSON.stringify({ 
        //       error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        //       code: 'EMAIL_NOT_VERIFIED',
        //       success: false 
        //     }),
        //     { 
        //       status: 403,
        //       headers: {
        //         'Content-Type': 'application/json'
        //       }
        //     }
        //   );
        // }

        console.log('API: Database user authenticated successfully');
        
        // Create JWT token
        const token = sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          process.env.JWT_SECRET || 'fallback_secret',
          { expiresIn: '1d' }
        );

        // User data
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.role === 'ADMIN'
        };

        console.log('API: Token created for database user, preparing response');
        
        // Set cookie
        const response = new NextResponse(
          JSON.stringify({ 
            message: 'Successfully logged in', 
            user: userData,
            token: token,
            success: true
          }),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
          }
        );

        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 1 day
          path: '/',
        });

        console.log('API: Database user login successful, sending response');
        return response;
      }
    } catch (dbError) {
      console.error('API: Database error, falling back to test users:', dbError);
      // Continue to test user authentication if database fails
    }

    // Fall back to test user authentication
    let testUser = TEST_USERS.find(user => user.email === email);
    
    // If no exact match, try wildcard (*) user
    if (!testUser) {
      testUser = TEST_USERS.find(user => user.email === '*');
    }
    
    if (testUser) {
      console.log('API: Test user login attempt:', email);
      
      try {
        // Test user password validation
        let passwordMatch = password === testUser.password;
        
        // Always accept default 'password'
        const isDefaultPassword = password === 'password';
        
        // Check alternate passwords if available
        const hasAlternatePasswords = 'alternatePasswords' in testUser && 
                                    Array.isArray(testUser.alternatePasswords);
        
        if (hasAlternatePasswords && !passwordMatch) {
          const user = testUser as UserWithAlternatePasswords;
          passwordMatch = user.alternatePasswords?.includes(password) || false;
        }
        
        // Wildcard user accepts 'password'
        const isWildcardUser = testUser.email === '*';
        
        // Password validation
        if (!(passwordMatch || isDefaultPassword || (isWildcardUser && password === 'password'))) {
          console.log('API: Password validation failed for test user');
          
          return new NextResponse(
            JSON.stringify({ error: 'Invalid credentials', success: false }),
            { 
              status: 401,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        console.log('API: Test user password validated');
        
        // Create dynamic user info for wildcard
        const isWild = testUser.email === '*';
        const userId = isWild ? `user_${Date.now()}` : testUser.id;
        const userName = isWild ? email.split('@')[0] : testUser.name;
        
        // Create JWT token
        const token = sign(
          {
            userId: userId,
            email: email,
            role: testUser.role,
          },
          process.env.JWT_SECRET || 'fallback_secret',
          { expiresIn: '1d' }
        );

        // User data
        const userData = {
          id: userId,
          email: email,
          name: userName,
          role: testUser.role,
          isAdmin: testUser.role === 'ADMIN'
        };

        console.log('API: Test user token created, preparing response');
        
        // Set cookie
        const response = new NextResponse(
          JSON.stringify({ 
            message: 'Successfully logged in (Test user)', 
            user: userData,
            token: token,
            success: true
          }),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
          }
        );

        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 1 day
          path: '/',
        });

        console.log('API: Test user login successful, sending response');
        return response;
      } catch (error) {
        console.error('API: Test user processing error:', error);
        return new NextResponse(
          JSON.stringify({ error: 'Authentication error', success: false }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    // No user found
    console.log('API: No matching user found:', email);
    return new NextResponse(
      JSON.stringify({ error: 'Invalid credentials', success: false }),
      { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('API: General error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error instanceof Error ? error.message : 'Unknown error', 
        success: false
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}