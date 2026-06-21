import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// In-memory database for demo mode
class InMemoryDB {
  private users: Map<string, any> = new Map();
  private transactions: Map<string, any> = new Map();
  private subscriptions: Map<string, any> = new Map();
  private goals: Map<string, any> = new Map();
  private insights: Map<string, any> = new Map();

  constructor() {
    // Initialize with demo user if empty
    this.initDemoData();
  }

  private initDemoData() {
    const demoUserId = 'demo-user-123';
    if (!this.users.has(demoUserId)) {
      this.users.set(demoUserId, {
        id: demoUserId,
        name: 'Demo User',
        email: 'demo@example.com',
        balance: 5000,
        created_at: new Date().toISOString(),
      });
    }
  }

  from(table: string) {
    const tableMap = this[table as keyof this] as Map<string, any>;
    const tableName = table;
    
    // Query builder class for chaining
    class QueryBuilder {
      private results: any[] = Array.from(tableMap.values());
      
      select(columns?: string) {
        this.results = Array.from(tableMap.values());
        return this;
      }
      
      eq(col: string, val: any) {
        this.results = this.results.filter((item: any) => {
          // Handle snake_case to camelCase mapping
          const snakeCol = col.replace(/([A-Z])/g, '_$1').toLowerCase();
          return item[col] === val || item[snakeCol] === val;
        });
        return this;
      }
      
      order(col: string, options?: { ascending?: boolean }) {
        this.results = [...this.results].sort((a: any, b: any) => {
          // Handle snake_case
          const snakeCol = col.replace(/([A-Z])/g, '_$1').toLowerCase();
          const aVal = a[col] ?? a[snakeCol];
          const bVal = b[col] ?? b[snakeCol];
          const ascending = options?.ascending ?? true;
          if (aVal < bVal) return ascending ? -1 : 1;
          if (aVal > bVal) return ascending ? 1 : -1;
          return 0;
        });
        return this;
      }
      
      limit(count: number) {
        this.results = this.results.slice(0, count);
        return this;
      }
      
      get data() {
        return this.results.length > 0 ? this.results : null;
      }
      
      get error() {
        return null;
      }
    }
    
    return {
      select: (columns?: string) => new QueryBuilder().select(columns),
      insert: (values: any) => {
        const id = values.id || `${tableName}-${Date.now()}-${Math.random()}`;
        const item = { ...values, id, created_at: new Date().toISOString() };
        tableMap.set(id, item);
        return {
          data: [item],
          error: null,
        };
      },
      update: (values: any) => ({
        eq: (col: string, val: any) => {
          // Find item by the column value
          const found = Array.from(tableMap.entries()).find(([_, item]) => {
            const snakeCol = col.replace(/([A-Z])/g, '_$1').toLowerCase();
            return item[col] === val || item[snakeCol] === val;
          });
          if (found) {
            const [id, item] = found;
            const updated = { ...item, ...values, updated_at: new Date().toISOString() };
            tableMap.set(id, updated);
            return { data: [updated], error: null };
          }
          return { data: null, error: { message: 'Not found' } };
        },
      }),
      delete: () => ({
        eq: (col: string, val: any) => {
          const found = Array.from(tableMap.entries()).find(([_, item]) => {
            const snakeCol = col.replace(/([A-Z])/g, '_$1').toLowerCase();
            return item[col] === val || item[snakeCol] === val;
          });
          if (found) {
            tableMap.delete(found[0]);
            return { data: null, error: null };
          }
          return { data: null, error: { message: 'Not found' } };
        },
      }),
    };
  }

  // Expose for seed script
  getTables() {
    return {
      users: this.users,
      transactions: this.transactions,
      subscriptions: this.subscriptions,
      goals: this.goals,
      insights: this.insights,
    };
  }
}

let inMemoryDB: InMemoryDB | null = null;

export function getSupabaseClient() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Use in-memory DB for demo mode or if Supabase is not configured
  if (isDemoMode || !supabaseUrl || !supabaseKey) {
    if (!inMemoryDB) {
      inMemoryDB = new InMemoryDB();
    }
    // Return a mock client that uses in-memory DB
    return inMemoryDB as any;
  }

  // Return real Supabase client
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Export for seed script access
export function getInMemoryDB() {
  if (!inMemoryDB) {
    inMemoryDB = new InMemoryDB();
  }
  return inMemoryDB;
}

