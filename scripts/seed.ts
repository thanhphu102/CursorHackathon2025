// Seed script to populate demo data
import { getInMemoryDB } from '@/lib/db/client';
import type { Transaction } from '@/types';

const DEMO_USER_ID = 'demo-user-123';

function generateTransactions(): Omit<Transaction, 'id' | 'createdAt'>[] {
  const now = new Date();
  const transactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];

  // Generate transactions for the last 3 months
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);

    // Recurring subscriptions (to be detected)
    const subscriptions = [
      { merchant: 'Netflix', amount: 15.99, day: 5 },
      { merchant: 'Spotify', amount: 9.99, day: 10 },
      { merchant: 'Amazon Prime', amount: 14.99, day: 15 },
      { merchant: 'Gym Membership', amount: 49.99, day: 20 },
    ];

    subscriptions.forEach((sub) => {
      const date = new Date(month.getFullYear(), month.getMonth(), sub.day);
      if (date <= now) {
        transactions.push({
          userId: DEMO_USER_ID,
          amount: -sub.amount,
          currency: 'USD',
          date: date.toISOString().split('T')[0],
          merchant: sub.merchant,
          category: 'Bills',
          source: 'bank_feed',
        });
      }
    });

    // Food expenses
    const foodMerchants = ['Starbucks', 'McDonald\'s', 'Chipotle', 'Whole Foods', 'Trader Joe\'s'];
    for (let i = 0; i < 15; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      if (date <= now) {
        transactions.push({
          userId: DEMO_USER_ID,
          amount: -(Math.random() * 50 + 10),
          currency: 'USD',
          date: date.toISOString().split('T')[0],
          merchant: foodMerchants[Math.floor(Math.random() * foodMerchants.length)],
          category: 'Food',
          source: 'manual',
        });
      }
    }

    // Transport expenses
    const transportMerchants = ['Uber', 'Lyft', 'Shell Gas', 'Parking Meter', 'Metro Transit'];
    for (let i = 0; i < 10; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      if (date <= now) {
        transactions.push({
          userId: DEMO_USER_ID,
          amount: -(Math.random() * 40 + 10),
          currency: 'USD',
          date: date.toISOString().split('T')[0],
          merchant: transportMerchants[Math.floor(Math.random() * transportMerchants.length)],
          category: 'Transport',
          source: 'manual',
        });
      }
    }

    // Shopping expenses
    const shoppingMerchants = ['Amazon', 'Target', 'Best Buy', 'Costco', 'Walmart'];
    for (let i = 0; i < 8; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      if (date <= now) {
        transactions.push({
          userId: DEMO_USER_ID,
          amount: -(Math.random() * 200 + 20),
          currency: 'USD',
          date: date.toISOString().split('T')[0],
          merchant: shoppingMerchants[Math.floor(Math.random() * shoppingMerchants.length)],
          category: 'Shopping',
          source: 'csv',
        });
      }
    }

    // Entertainment
    const entertainmentMerchants = ['AMC Theaters', 'Spotify', 'Apple Music', 'Steam'];
    for (let i = 0; i < 5; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      if (date <= now) {
        transactions.push({
          userId: DEMO_USER_ID,
          amount: -(Math.random() * 30 + 5),
          currency: 'USD',
          date: date.toISOString().split('T')[0],
          merchant: entertainmentMerchants[Math.floor(Math.random() * entertainmentMerchants.length)],
          category: 'Entertainment',
          source: 'manual',
        });
      }
    }

    // Income
    if (monthOffset === 0 || monthOffset === 1) {
      const payday = new Date(month.getFullYear(), month.getMonth(), 1);
      if (payday <= now) {
        transactions.push({
          userId: DEMO_USER_ID,
          amount: 5000,
          currency: 'USD',
          date: payday.toISOString().split('T')[0],
          merchant: 'Salary',
          category: 'Income',
          source: 'bank_feed',
        });
      }
    }
  }

  return transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

async function seed() {
  console.log('🌱 Seeding demo data...');

  const db = getInMemoryDB();
  const tables = db.getTables();

  // Ensure demo user exists
  const userExists = Array.from(tables.users.values()).find(
    (u: any) => u.id === DEMO_USER_ID
  );

  if (!userExists) {
    db.from('users').insert({
      id: DEMO_USER_ID,
      name: 'Demo User',
      email: 'demo@example.com',
      balance: 5000,
    });
    console.log('✅ Created demo user');
  }

  // Seed transactions
  const transactions = generateTransactions();
  let inserted = 0;
  for (const transaction of transactions) {
    const existing = Array.from(tables.transactions.values()).find(
      (t: any) =>
        t.user_id === transaction.userId &&
        t.merchant === transaction.merchant &&
        t.date === transaction.date &&
        Math.abs(parseFloat(t.amount) - transaction.amount) < 0.01
    );

    if (!existing) {
      db.from('transactions').insert({
        user_id: transaction.userId,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        date: transaction.date,
        merchant: transaction.merchant,
        category: transaction.category,
        source: transaction.source,
      });
      inserted++;
    }
  }
  console.log(`✅ Seeded ${inserted} transactions`);

  // Seed a goal
  const goals = Array.from(tables.goals.values());
  if (goals.length === 0) {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 6);
    db.from('goals').insert({
      user_id: DEMO_USER_ID,
      title: 'Emergency Fund',
      target_amount: '10000',
      current_amount: '2500',
      currency: 'USD',
      start_date: new Date().toISOString().split('T')[0],
      deadline: deadline.toISOString().split('T')[0],
      suggested_save_per_period: '1250',
    });
    console.log('✅ Created sample goal');
  }

  console.log('✨ Seeding complete!');
}

seed().catch(console.error);

