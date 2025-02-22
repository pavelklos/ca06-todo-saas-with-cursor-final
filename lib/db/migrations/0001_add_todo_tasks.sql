CREATE TABLE IF NOT EXISTS "todo_tasks" (
    "id" serial PRIMARY KEY NOT NULL,
    "team_id" integer NOT NULL,
    "title" varchar(255) NOT NULL,
    "description" text,
    "status" varchar(20) NOT NULL DEFAULT 'pending',
    "created_by" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "todo_tasks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action,
    CONSTRAINT "todo_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);