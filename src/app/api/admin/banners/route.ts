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

export async function GET() {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const banners = await db.banner.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching admin banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, subtitle, buttonText, buttonLink, imageUrl, isActive, sortOrder } = body;

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return NextResponse.json({ error: 'Banner image is required.' }, { status: 400 });
    }

    // Determine default sortOrder if not provided
    let nextSortOrder = sortOrder !== undefined ? Number(sortOrder) : 0;
    if (sortOrder === undefined) {
      const maxOrderBanner = await db.banner.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      nextSortOrder = (maxOrderBanner?.sortOrder ?? 0) + 1;
    }

    const banner = await db.banner.create({
      data: {
        title: title ? title.trim() : null,
        subtitle: subtitle ? subtitle.trim() : null,
        buttonText: buttonText ? buttonText.trim() : null,
        buttonLink: buttonLink ? buttonLink.trim() : null,
        imageUrl: imageUrl.trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
