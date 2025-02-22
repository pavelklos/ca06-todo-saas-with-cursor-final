import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers, todoTasks } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  // Create some test tasks
  await db.insert(todoTasks).values([
    {
      teamId: team.id,
      title: 'Welcome Task',
      description: 'This is your first task. Try marking it as completed!',
      status: 'pending',
      createdBy: user.id,
    },
    {
      teamId: team.id,
      title: 'Create More Tasks',
      description: 'Try creating new tasks using the form above.',
      status: 'pending',
      createdBy: user.id,
    },
    {
      teamId: team.id,
      title: 'Test Task Management',
      description: 'Edit or delete tasks using the menu on the right.',
      status: 'completed',
      createdBy: user.id,
    },
  ]);

  console.log('Test tasks created.');

  await createStripeProducts();
}

seed().catch(console.error);
