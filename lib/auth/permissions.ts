import { TeamMember, teamMembers, todoTasks } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { and, eq } from 'drizzle-orm';

export function canManageTasks(teamMember?: TeamMember | null) {
  return teamMember?.role === 'owner' || teamMember?.role === 'member';
}

export function canCreateTasks(teamMember?: TeamMember | null) {
  return teamMember?.role === 'owner';
}

export async function validateTaskAccess(
  taskId: number,
  userId: number,
  teamId: number,
  db: any
) {
  // Get the team member record
  const [teamMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.teamId, teamId)
      )
    )
    .limit(1);

  // Get the task
  const [task] = await db
    .select()
    .from(todoTasks)
    .where(eq(todoTasks.id, taskId))
    .limit(1);

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.teamId !== teamId) {
    throw new Error('Task does not belong to this team');
  }

  if (!canManageTasks(teamMember)) {
    throw new Error('You do not have permission to manage tasks');
  }

  return { task, teamMember };
} 