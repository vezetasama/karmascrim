import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePasswordResetToken, hashToken } from '@/lib/auth';
import { validateEmail } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.message }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Don't reveal that the email doesn't exist
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been generated.',
      });
    }

    // Invalidate any existing unused reset tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate new reset token
    const rawToken = generatePasswordResetToken();
    const hashedToken = hashToken(rawToken);

    await db.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Build reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;

    // In production, send email here. For dev, return the link.
    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been generated.',
      ...(isDev && {
        devOnly: {
          resetLink,
          note: '⚠️ This link is only shown in development mode. In production, it would be sent via email.',
        },
      }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process password reset request' }, { status: 500 });
  }
}
