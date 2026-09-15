import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, hashToken } from '@/lib/auth';
import { validatePassword, validateConfirmPassword } from '@/lib/validation';
import { notifyPasswordChanged } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const { token, newPassword, confirmPassword } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }

    // Validate new password
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    if (confirmPassword !== undefined) {
      const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
      if (!confirmCheck.valid) {
        return NextResponse.json({ error: confirmCheck.message }, { status: 400 });
      }
    }

    // Hash the raw token and look it up
    const hashedToken = hashToken(token);

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    if (resetToken.used) {
      return NextResponse.json({ error: 'This reset link has already been used. Please request a new one.' }, { status: 400 });
    }

    if (new Date() > resetToken.expiresAt) {
      // Mark as used so it can't be attempted again
      await db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    // Update password and mark token as used
    const newPasswordHash = await hashPassword(newPassword);

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    await notifyPasswordChanged(resetToken.userId);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
