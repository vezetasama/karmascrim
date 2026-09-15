import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';

async function checkAdminAuth() {
  const adminSession = await getCurrentAdmin();
  if (adminSession) return adminSession;

  const userSession = await getCurrentUser();
  if (userSession && userSession.role === 'ADMIN') return userSession;

  return null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, subtitle, buttonText, buttonLink, imageUrl, isActive, sortOrder } = body;

    const existingBanner = await db.banner.findUnique({ where: { id } });
    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const updatedBanner = await db.banner.update({
      where: { id },
      data: {
        title: title !== undefined ? (title ? title.trim() : null) : existingBanner.title,
        subtitle: subtitle !== undefined ? (subtitle ? subtitle.trim() : null) : existingBanner.subtitle,
        buttonText: buttonText !== undefined ? (buttonText ? buttonText.trim() : null) : existingBanner.buttonText,
        buttonLink: buttonLink !== undefined ? (buttonLink ? buttonLink.trim() : null) : existingBanner.buttonLink,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : existingBanner.imageUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : existingBanner.isActive,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : existingBanner.sortOrder,
      },
    });

    return NextResponse.json({ success: true, banner: updatedBanner });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingBanner = await db.banner.findUnique({ where: { id } });
    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    await db.banner.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
