import { db } from '@/lib/db';

export type NotificationType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TOURNAMENT'
  | 'TOPUP'
  | 'ACCOUNT'
  | 'ANNOUNCEMENT';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  relatedId?: string;
  actionUrl?: string;
  actionText?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  sentBy?: string;
}

export interface BroadcastNotificationParams {
  recipientType: 'ALL' | 'SPECIFIC';
  targetUserIds?: string[];
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
  actionText?: string;
  sentBy: string;
}

/**
 * Creates a single user notification in the database safely.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const {
      userId,
      title,
      message,
      type = 'ANNOUNCEMENT',
      relatedId,
      actionUrl,
      actionText,
      status,
      sentBy,
    } = params;

    if (!userId || !title || !message) {
      console.warn('createNotification missing required fields', params);
      return null;
    }

    const notification = await db.notification.create({
      data: {
        userId,
        title: title.trim(),
        message: message.trim(),
        type,
        relatedId: relatedId || null,
        actionUrl: actionUrl || null,
        actionText: actionText || null,
        status: status || null,
        sentBy: sentBy || null,
        linkUrl: actionUrl || null,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Sends a notification to ALL users or a list of SPECIFIC users and logs the admin action.
 */
export async function createBroadcastNotification(params: BroadcastNotificationParams) {
  try {
    const {
      recipientType,
      targetUserIds = [],
      title,
      message,
      type = 'ANNOUNCEMENT',
      actionUrl,
      actionText,
      sentBy,
    } = params;

    let userIds: string[] = [];

    if (recipientType === 'ALL') {
      const users = await db.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else {
      userIds = Array.from(new Set(targetUserIds.filter(Boolean)));
    }

    if (userIds.length === 0) {
      return { success: false, recipientCount: 0, error: 'No recipients found.' };
    }

    const notificationsData = userIds.map((userId) => ({
      userId,
      title: title.trim(),
      message: message.trim(),
      type,
      actionUrl: actionUrl || null,
      actionText: actionText || null,
      sentBy,
      linkUrl: actionUrl || null,
    }));

    // Batch create notifications
    await db.notification.createMany({
      data: notificationsData,
    });

    // Record log in AdminNotificationLog table
    const log = await db.adminNotificationLog.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        type,
        recipientType,
        recipientCount: userIds.length,
        targetUserIds: recipientType === 'SPECIFIC' ? JSON.stringify(userIds) : null,
        actionUrl: actionUrl || null,
        actionText: actionText || null,
        sentBy,
      },
    });

    return {
      success: true,
      recipientCount: userIds.length,
      log,
    };
  } catch (error: any) {
    console.error('Error sending broadcast notification:', error);
    return { success: false, recipientCount: 0, error: error.message || 'Failed to send notifications' };
  }
}

// ----------------------------------------------------
// Standardized Notification Generators
// ----------------------------------------------------

export async function notifyDepositSubmitted(
  userId: string,
  amount: number,
  requestId: string,
  transactionId: string
) {
  return createNotification({
    userId,
    title: 'Deposit Request Submitted',
    message: `Your deposit request of NPR ${amount.toLocaleString()} is pending admin approval. (Req: ${requestId}, Tx: ${transactionId})`,
    type: 'DEPOSIT',
    status: 'PENDING',
    relatedId: requestId,
    actionUrl: '/wallet',
    actionText: 'View Wallet',
  });
}

export async function notifyDepositApproved(
  userId: string,
  amount: number,
  requestId: string,
  newBalance: number
) {
  return createNotification({
    userId,
    title: 'Deposit Approved ✅',
    message: `Your deposit of NPR ${amount.toLocaleString()} has been approved and added to your balance. New balance: NPR ${newBalance.toLocaleString()}.`,
    type: 'DEPOSIT',
    status: 'SUCCESS',
    relatedId: requestId,
    actionUrl: '/wallet',
    actionText: 'View Wallet',
  });
}

export async function notifyDepositRejected(
  userId: string,
  amount: number,
  requestId: string,
  reason?: string
) {
  return createNotification({
    userId,
    title: 'Deposit Rejected',
    message: `Your deposit request of NPR ${amount.toLocaleString()} was rejected.${reason ? ` Reason: ${reason}` : ' Please check the reason in your wallet.'}`,
    type: 'DEPOSIT',
    status: 'FAILED',
    relatedId: requestId,
    actionUrl: '/wallet',
    actionText: 'View Wallet',
  });
}

export async function notifyWithdrawalRequested(
  userId: string,
  amount: number,
  requestId: string
) {
  return createNotification({
    userId,
    title: 'Withdrawal Request Submitted',
    message: `Your withdrawal request of NPR ${amount.toLocaleString()} has been submitted and is awaiting review. (Req: ${requestId})`,
    type: 'WITHDRAWAL',
    status: 'PENDING',
    relatedId: requestId,
    actionUrl: '/wallet',
    actionText: 'View Wallet',
  });
}

export async function notifyWithdrawalApproved(
  userId: string,
  amount: number,
  requestId: string
) {
  return createNotification({
    userId,
    title: 'Withdrawal Approved ✅',
    message: `Your withdrawal of NPR ${amount.toLocaleString()} has been approved. Please check your payment account.`,
    type: 'WITHDRAWAL',
    status: 'SUCCESS',
    relatedId: requestId,
    actionUrl: '/wallet',
    actionText: 'View Wallet',
  });
}

export async function notifyWithdrawalRejected(
  userId: string,
  amount: number,
  requestId: string,
  reason?: string
) {
  return createNotification({
    userId,
    title: 'Withdrawal Rejected',
    message: `Your withdrawal request of NPR ${amount.toLocaleString()} was rejected.${reason ? ` Reason: ${reason}` : ' Please check the reason in your wallet.'}`,
    type: 'WITHDRAWAL',
    status: 'FAILED',
    relatedId: requestId,
    actionUrl: '/wallet',
    actionText: 'View Wallet',
  });
}

export async function notifyWithdrawalCompleted(
  userId: string,
  amount: number,
  requestId: string
) {
  return createNotification({
    userId,
    title: 'Withdrawal Completed 💸',
    message: `Your withdrawal of NPR ${amount.toLocaleString()} has been successfully processed.`,
    type: 'WITHDRAWAL',
    status: 'SUCCESS',
    relatedId: requestId,
    actionUrl: '/wallet',
    actionText: 'View Wallet',
  });
}

export async function notifyTournamentJoined(
  userId: string,
  tournamentName: string,
  tournamentId: string
) {
  return createNotification({
    userId,
    title: 'Tournament Joined 🎮',
    message: `You have successfully joined ${tournamentName}. Your entry fee has been deducted and slot confirmed.`,
    type: 'TOURNAMENT',
    status: 'SUCCESS',
    relatedId: tournamentId,
    actionUrl: `/tournaments/${tournamentId}`,
    actionText: 'View Tournament',
  });
}

export async function notifyRoomDetails(
  userIds: string[],
  tournamentName: string,
  tournamentId: string,
  isUpdate = false
) {
  if (!userIds || userIds.length === 0) return;

  const title = isUpdate ? 'Room Details Updated 🔐' : 'Room ID & Password Available 🎮';
  const message = isUpdate
    ? `The Room ID and password for ${tournamentName} have been updated. Open the tournament to view the latest details.`
    : `The Room ID and password for ${tournamentName} are now available. Join the room before the match starts.`;
  const actionText = isUpdate ? 'View Tournament' : 'View Room Details';

  const notificationsData = userIds.map((userId) => ({
    userId,
    title,
    message,
    type: 'TOURNAMENT',
    relatedId: tournamentId,
    actionUrl: `/tournaments/${tournamentId}`,
    actionText,
    linkUrl: `/tournaments/${tournamentId}`,
  }));

  try {
    await db.notification.createMany({ data: notificationsData });
  } catch (err) {
    console.error('Failed sending room notifications', err);
  }
}

export async function notifyAccountRegistered(userId: string, username: string) {
  return createNotification({
    userId,
    title: 'Welcome to Karma Scrims! 🎮',
    message: `Welcome @${username}! Your account has been created successfully. Explore tournaments and top up your wallet to start competing.`,
    type: 'ACCOUNT',
    actionUrl: '/dashboard',
    actionText: 'My Dashboard',
  });
}

export async function notifyPasswordChanged(userId: string) {
  return createNotification({
    userId,
    title: 'Security Alert: Password Changed 🔐',
    message: 'Your account password was updated successfully. If you did not make this change, please contact support immediately.',
    type: 'ACCOUNT',
    status: 'SUCCESS',
    actionUrl: '/profile',
    actionText: 'View Profile',
  });
}

export async function notifyWalletAdjusted(
  userId: string,
  amount: number,
  newBalance: number,
  reason?: string
) {
  const isCredit = amount >= 0;
  return createNotification({
    userId,
    title: isCredit ? 'Wallet Balance Credited 💰' : 'Wallet Balance Adjusted',
    message: `NPR ${Math.abs(amount).toLocaleString()} was ${isCredit ? 'added to' : 'deducted from'} your balance.${reason ? ` Reason: ${reason}.` : ''} New Balance: NPR ${newBalance.toLocaleString()}.`,
    type: 'DEPOSIT',
    status: isCredit ? 'SUCCESS' : 'PENDING',
    actionUrl: '/wallet',
    actionText: 'View Wallet',
  });
}
