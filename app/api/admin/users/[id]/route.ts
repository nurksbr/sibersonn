import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    let currentUserId: string
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret'
      ) as { userId: string; role?: string }
      
      currentUserId = decoded.userId
      
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

    // Kullanıcıyı kontrol et ve admin yetkisini doğrula
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, role: true, email: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkisiz erişim. Admin yetkiniz bulunmuyor.' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Kendi hesabını silmeye çalışıyor mu kontrol et
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: 'Kendi hesabınızı silemezsiniz' },
        { status: 400 }
      )
    }

    // Kullanıcının var olup olmadığını kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Kullanıcıyı sil
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json(
      { 
        message: 'Kullanıcı başarıyla silindi',
        deletedUserId: userId 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error)
    return NextResponse.json(
      { error: 'Kullanıcı silinirken hata oluştu' },
      { status: 500 }
    )
  }
} 