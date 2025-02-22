'use client';

import { useRouter } from 'next/navigation';
import { TaskList } from './task-list';
import { CreateTask } from './create-task';
import { TodoTask } from '@/lib/db/schema';

interface TasksContentProps {
  teamId: number;
  userId: number;
  userRole: string;
  isOwner: boolean;
  initialTasks: TodoTask[];
}

export function TasksContent({ 
  teamId, 
  userId, 
  userRole, 
  isOwner,
  initialTasks 
}: TasksContentProps) {
  const router = useRouter();

  const handleTaskCreated = () => {
    router.refresh();
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Team Tasks</h1>
      {isOwner && (
        <CreateTask 
          teamId={teamId} 
          userId={userId}
          onTaskCreated={handleTaskCreated}
        />
      )}
      <TaskList 
        teamId={teamId} 
        userId={userId}
        userRole={userRole}
        initialTasks={initialTasks}
      />
    </section>
  );
} 