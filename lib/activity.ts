'use server';

import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';
import { headers } from 'next/headers';

export async function logActivity(
  teamId: number,
  userId: number,
  action: ActivityType
) {
  try {
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     '127.0.0.1';

    await db.insert(activityLogs).values({
      teamId,
      userId,
      action,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent disrupting the main operation
  }
} 