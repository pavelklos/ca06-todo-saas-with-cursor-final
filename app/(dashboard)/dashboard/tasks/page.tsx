import { redirect } from 'next/navigation';
import { getTeamForUser, getUser, getTodoTasksForTeam } from '@/lib/db/queries';
import { TasksContent } from './tasks-content';

export default async function TasksPage() {
  try {
    const user = await getUser();

    if (!user) {
      redirect('/sign-in');
    }

    const teamData = await getTeamForUser(user.id);

    if (!teamData) {
      throw new Error('Team not found');
    }

    const teamMember = teamData.teamMembers.find(
      (member) => member.user.id === user.id
    );

    const isOwner = teamMember?.role === 'owner';
    const userRole = teamMember?.role || 'viewer';

    // Fetch initial tasks
    const initialTasks = await getTodoTasksForTeam(teamData.id, user.id);

    return (
      <TasksContent 
        teamId={teamData.id} 
        userId={user.id}
        userRole={userRole}
        isOwner={isOwner}
        initialTasks={initialTasks}
      />
    );
  } catch (error) {
    console.error('Error in TasksPage:', error);
    return (
      <div className="flex-1 p-4 lg:p-8">
        <div className="text-red-500">
          An error occurred while loading tasks. Please try again later.
        </div>
      </div>
    );
  }
} 