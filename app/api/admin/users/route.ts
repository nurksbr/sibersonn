import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Token tabanlı admin yetki kontrolü
    const authHeader = request.headers.get('authorization')
    let token = authHeader?.replace('Bearer ', '')
    
    // Eğer header'da token yoksa cookie'den al
    if (!token) {
      token = request.cookies.get('auth_token')?.value
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'i bulunamadı' },
        { status: 401 }
      )
    }

    let userId: string
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret'
      ) as { userId: string; role?: string }
      
      userId = decoded.userId
      
      // Admin yetkisi kontrolü
      if (decoded.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Admin yetkisi gereklidir' },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      )
    }

    // Kullanıcının admin olup olmadığını kontrol et
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bu işlem için admin yetkisi gereklidir' },
        { status: 403 }
      )
    }

    // Tüm kullanıcıları getir
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(
      { 
        users,
        count: users.length 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin users API hatası:', error)
    return NextResponse.json(
      { error: 'Kullanıcılar getirilemedi' },
      { status: 500 }
    )
  }
} 