// AI prompt templates for various use cases

export const CATEGORIZATION_PROMPT = `You are a financial transaction categorizer. Analyze the following transaction and categorize it into one of these categories:
- Food
- Transport
- Shopping
- Bills
- Entertainment
- Others
- Income

Transaction details:
Merchant: {merchant}
Amount: {amount}
Description/Notes: {description}

Respond with ONLY the category name, nothing else.`;

export const INSIGHTS_GENERATION_PROMPT = `You are a personal finance AI assistant. Analyze the following spending data and generate 3-5 actionable insights.

Current month spending: {currentMonthSpend}
Previous month spending: {previousMonthSpend}
Spending by category: {categoryBreakdown}
Current balance: {currentBalance}
Goals: {goalsSummary}

Generate insights that:
1. Compare spending patterns (weekly/monthly)
2. Identify overspending categories
3. Provide predictions (end-of-month balance, trends)
4. Suggest budget adjustments

Format each insight as a clear, concise sentence. Be specific with numbers and percentages.`;

export const GOAL_SUGGESTION_PROMPT = `You are a financial goal advisor. Given the following information, suggest a weekly/monthly savings amount for a financial goal.

Goal:
- Title: {goalTitle}
- Target Amount: {targetAmount}
- Current Amount: {currentAmount}
- Deadline: {deadline}
- Days Remaining: {daysRemaining}

User Financials:
- Current Balance: {currentBalance}
- Average Monthly Spending: {avgMonthlySpend}
- Average Monthly Income: {avgMonthlyIncome}

Suggest a realistic savings amount per {period} (weekly or monthly) that will help the user reach their goal on time. Consider their spending habits and available funds.

Respond with a JSON object: {"suggestedAmount": number, "reasoning": "string"}`;

export const SPENDING_ANALYSIS_PROMPT = `Analyze the spending pattern and provide a natural language summary.

Transactions this month: {transactionCount}
Total spending: {totalSpend}
Category breakdown: {categoryBreakdown}
Comparison to last month: {monthOverMonthChange}

Provide a brief, conversational summary highlighting key insights and any concerning patterns.`;

// Helper function to format prompts with variables
export function formatPrompt(template: string, variables: Record<string, any>): string {
  let formatted = template;
  for (const [key, value] of Object.entries(variables)) {
    formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }
  return formatted;
}

