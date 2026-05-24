export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  role: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  description?: string;
  merchantName?: string;
  location?: string;
  date: string;
  riskScore: number;
  isFlagged: boolean;
}

export interface TransactionRequest {
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  description?: string;
  merchantName?: string;
  location?: string;
  date: string;
}

export interface FraudAlert {
  id: number;
  transactionId: number;
  alertType: string;
  description: string;
  riskScore: number;
  status: 'Open' | 'Reviewed' | 'Dismissed';
  createdAt: string;
  transaction: Transaction;
}

export interface Budget {
  id: number;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
}

export interface BudgetRequest {
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
}

export interface Insight {
  id: number;
  type: string;
  title: string;
  message: string;
  category?: string;
  changePercent?: number;
  severity: 'Info' | 'Warning' | 'Critical';
  generatedAt: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  openFraudAlerts: number;
  spendingByCategory: CategorySpend[];
  monthlyTrends: MonthlyTrend[];
  budgetStatuses: BudgetStatus[];
}

export interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

export interface BudgetStatus {
  category: string;
  limit: number;
  spent: number;
  isOverBudget: boolean;
  percentUsed: number;
}

export interface AdminSummary {
  totalUsers: number;
  totalTransactions: number;
  openAlerts: number;
  totalTransactionVolume: number;
  recentAlerts: RecentAlert[];
}

export interface RecentAlert {
  id: number;
  userEmail: string;
  alertType: string;
  riskScore: number;
  createdAt: string;
}

export const CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Other Income',
  'Food & Groceries', 'Transport', 'Housing', 'Entertainment',
  'Healthcare', 'Education', 'Clothing', 'Utilities', 'Subscriptions', 'Other'
] as const;