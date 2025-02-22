'use server';

import { db } from '@/lib/db/drizzle';
import { todoTasks, teamMembers, ActivityType } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { logActivity } from '@/lib/activity';
import { validateTaskAccess, canCreateTasks } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';

export async function fetchTasks(teamId: number) {
  try {
    return await db
      .select()
      .from(todoTasks)
      .where(eq(todoTasks.teamId, teamId))
      .orderBy(desc(todoTasks.createdAt));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

export async function createTask(
  userId: number,
  teamId: number,
  data: {
    title: string;
    description?: string | null;
  }
) {
  try {
    const task = await db
      .insert(todoTasks)
      .values({
        teamId,
        createdBy: userId,
        title: data.title,
        description: data.description,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logActivity(teamId, userId, ActivityType.CREATE_TODO);
    
    revalidatePath('/dashboard/tasks');
    
    return task[0];
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
}

export async function updateTask(
  taskId: number,
  userId: number,
  teamId: number,
  data: {
    title?: string;
    description?: string | null;
    status?: 'pending' | 'completed';
  }
) {
  try {
    await validateTaskAccess(taskId, userId, teamId, db);
    
    const task = await db
      .update(todoTasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(todoTasks.id, taskId))
      .returning();

    await logActivity(teamId, userId, ActivityType.UPDATE_TODO);
    revalidatePath('/dashboard/tasks');
    return task[0];
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }
}

export async function deleteTask(taskId: number, userId: number, teamId: number) {
  try {
    await validateTaskAccess(taskId, userId, teamId, db);
    
    await db
      .delete(todoTasks)
      .where(eq(todoTasks.id, taskId));

    await logActivity(teamId, userId, ActivityType.DELETE_TODO);
    revalidatePath('/dashboard/tasks');
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
} 