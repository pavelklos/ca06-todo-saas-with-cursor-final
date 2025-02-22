'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TodoTask } from '@/lib/db/schema';
import { Loader2 } from 'lucide-react';
import { TaskActions } from './task-actions';
import { fetchTasks } from './actions';

type TaskListProps = {
  teamId: number;
  userId: number;
  userRole: string;
  initialTasks: TodoTask[];
};

export function TaskList({ teamId, userId, userRole, initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<TodoTask[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const updatedTasks = await fetchTasks(teamId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [teamId]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No tasks yet. Create your first task to get started!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {tasks.map((task) => (
            <div key={task.id} className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
                {(userRole === 'owner' || userRole === 'member') && (
                  <TaskActions
                    task={task}
                    teamId={teamId}
                    userId={userId}
                    onTaskUpdated={loadTasks}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 