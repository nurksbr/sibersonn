import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı', isAuthenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          isAdmin: session.user.isAdmin
        }, 
        isAuthenticated: true 
      }, 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        } 
      }
    );
  } catch (error) {
    console.error('Oturum kontrolü hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', isAuthenticated: false },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  }
} 