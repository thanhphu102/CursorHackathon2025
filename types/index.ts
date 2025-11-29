// Core data types for the Personal Finance AI Assistant

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export type TransactionCategory =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Others'
  | 'Income';

export type TransactionSource = 'manual' | 'csv' | 'receipt' | 'bank_feed';

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export type InsightType =
  | 'spending_comparison'
  | 'overspending'
  | 'subscription_alert'
  | 'goal_progress'
  | 'balance_forecast'
  | 'category_trend';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
  balance?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Positive for income, negative for expenses
  currency: Currency;
  date: Date | string;
  merchant: string;
  category: TransactionCategory;
  source: TransactionSource;
  rawText?: string; // OCR text or notes
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Subscription {
  id: string;
  userId: string;
  transactionIds: string[]; // Related transactions
  serviceName: string;
  amount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  nextBillingDate: Date | string;
  isActive: boolean;
  isSnoozed?: boolean;
  createdAt: Date | string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  startDate: Date | string;
  deadline: Date | string;
  suggestedSavePerPeriod?: number; // Weekly or monthly based on deadline
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Insight {
  id: string;
  userId: string;
  type: InsightType;
  message: string;
  metadata?: Record<string, any>; // Additional data for the insight
  createdAt: Date | string;
}

export interface ReceiptScanResult {
  merchant?: string;
  total?: number;
  date?: Date | string;
  items?: Array<{
    description: string;
    amount: number;
  }>;
  rawText: string;
  confidence: number;
}

export interface CSVImportRow {
  date: string;
  amount: string | number;
  merchant: string;
  category?: string;
  description?: string;
}

export interface SpendingComparison {
  period: 'week' | 'month';
  current: number;
  previous: number;
  change: number; // Percentage change
  category?: TransactionCategory;
}

export interface SubscriptionDetectionResult {
  subscriptions: Subscription[];
  confidence: number;
  reasoning: string;
}

