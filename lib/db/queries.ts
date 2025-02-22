import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, todoTasks, type NewTodoTask, type TodoTask } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { canManageTasks, canCreateTasks, validateTaskAccess } from '@/lib/auth/permissions';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser(userId: number) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMembers: {
        with: {
          team: {
            with: {
              teamMembers: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.teamMembers[0]?.team || null;
}

export async function createTodoTask(data: NewTodoTask): Promise<TodoTask> {
  const [teamMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.userId, data.createdBy),
        eq(teamMembers.teamId, data.teamId)
      )
    )
    .limit(1);

  if (!canCreateTasks(teamMember)) {
    throw new Error('You do not have permission to create tasks');
  }

  const [task] = await db
    .insert(todoTasks)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return task;
}

export async function getTodoTasksForTeam(
  teamId: number,
  userId: number
): Promise<TodoTask[]> {
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

  if (!teamMember) {
    throw new Error('You do not have access to this team');
  }

  return db
    .select()
    .from(todoTasks)
    .where(eq(todoTasks.teamId, teamId))
    .orderBy(desc(todoTasks.createdAt));
}

export async function getTodoTaskById(taskId: number): Promise<TodoTask | null> {
  const [task] = await db
    .select()
    .from(todoTasks)
    .where(eq(todoTasks.id, taskId))
    .limit(1);

  return task || null;
}

export async function updateTodoTask(
  taskId: number,
  data: Partial<Pick<TodoTask, 'title' | 'description' | 'status'>>,
  userId: number,
  teamId: number
): Promise<TodoTask | null> {
  const { task } = await validateTaskAccess(taskId, userId, teamId, db);

  const [updatedTask] = await db
    .update(todoTasks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(todoTasks.id, taskId))
    .returning();

  return updatedTask || null;
}

export async function deleteTodoTask(
  taskId: number,
  userId: number,
  teamId: number
): Promise<boolean> {
  await validateTaskAccess(taskId, userId, teamId, db);

  const [deletedTask] = await db
    .delete(todoTasks)
    .where(eq(todoTasks.id, taskId))
    .returning();

  return !!deletedTask;
}
