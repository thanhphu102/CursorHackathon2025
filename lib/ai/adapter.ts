// AI Adapter: Handles both demo mode and live API calls
import type { TransactionCategory, InsightType } from '@/types';
import * as prompts from './prompts';
import * as mocks from './mocks';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const openaiApiKey = process.env.OPENAI_API_KEY;

export interface CategorizationResult {
  category: TransactionCategory;
  confidence: number;
}

export interface InsightResult {
  type: InsightType;
  message: string;
  metadata?: Record<string, any>;
}

export interface GoalSuggestionResult {
  suggestedAmount: number;
  reasoning: string;
}

class AIAdapter {
  private async callOpenAI(
    prompt: string,
    systemPrompt?: string,
    jsonMode = false
  ): Promise<string> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async categorizeTransaction(
    merchant: string,
    amount: number,
    description?: string
  ): Promise<CategorizationResult> {
    if (isDemoMode) {
      // Use mock categorization
      const category = mocks.mockCategorizeTransaction(merchant, amount, description);
      return {
        category,
        confidence: 0.85, // Mock confidence
      };
    }

    try {
      const prompt = prompts.formatPrompt(prompts.CATEGORIZATION_PROMPT, {
        merchant,
        amount: amount.toString(),
        description: description || 'N/A',
      });

      const response = await this.callOpenAI(prompt);
      const category = response.trim() as TransactionCategory;

      // Validate category
      const validCategories: TransactionCategory[] = [
        'Food',
        'Transport',
        'Shopping',
        'Bills',
        'Entertainment',
        'Others',
        'Income',
      ];

      if (validCategories.includes(category)) {
        return { category, confidence: 0.9 };
      }

      // Fallback to mock if invalid response
      return {
        category: mocks.mockCategorizeTransaction(merchant, amount, description),
        confidence: 0.7,
      };
    } catch (error) {
      console.error('AI categorization error:', error);
      // Fallback to mock on error
      return {
        category: mocks.mockCategorizeTransaction(merchant, amount, description),
        confidence: 0.6,
      };
    }
  }

  async generateInsights(
    currentMonthSpend: number,
    previousMonthSpend: number,
    categoryBreakdown: Record<string, number>,
    currentBalance: number,
    goalsSummary?: string
  ): Promise<InsightResult[]> {
    if (isDemoMode) {
      return mocks.mockGenerateInsights(
        currentMonthSpend,
        previousMonthSpend,
        categoryBreakdown,
        currentBalance
      ).map((insight) => ({
        type: insight.type,
        message: insight.message,
        metadata: {},
      }));
    }

    try {
      const prompt = prompts.formatPrompt(prompts.INSIGHTS_GENERATION_PROMPT, {
        currentMonthSpend: currentMonthSpend.toString(),
        previousMonthSpend: previousMonthSpend.toString(),
        categoryBreakdown: JSON.stringify(categoryBreakdown),
        currentBalance: currentBalance.toString(),
        goalsSummary: goalsSummary || 'No active goals',
      });

      const response = await this.callOpenAI(
        prompt,
        'You are a helpful financial advisor. Provide clear, actionable insights in plain language.'
      );

      // Parse response (assumes insights are separated by newlines or bullets)
      const lines = response
        .split('\n')
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line) => line.length > 0);

      return lines.slice(0, 5).map((message, index) => ({
        type: 'spending_comparison' as InsightType,
        message,
        metadata: { index },
      }));
    } catch (error) {
      console.error('AI insights generation error:', error);
      // Fallback to mock
      return mocks.mockGenerateInsights(
        currentMonthSpend,
        previousMonthSpend,
        categoryBreakdown,
        currentBalance
      ).map((insight) => ({
        type: insight.type,
        message: insight.message,
        metadata: {},
      }));
    }
  }

  async suggestSavingsAmount(
    goalTitle: string,
    targetAmount: number,
    currentAmount: number,
    deadline: Date,
    currentBalance: number,
    avgMonthlySpend: number,
    avgMonthlyIncome: number
  ): Promise<GoalSuggestionResult> {
    const daysRemaining = Math.ceil(
      (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const period = daysRemaining > 30 ? 'month' : 'week';

    if (isDemoMode) {
      return mocks.mockSuggestSavingsAmount(
        targetAmount,
        currentAmount,
        daysRemaining,
        avgMonthlyIncome,
        avgMonthlySpend
      );
    }

    try {
      const prompt = prompts.formatPrompt(prompts.GOAL_SUGGESTION_PROMPT, {
        goalTitle,
        targetAmount: targetAmount.toString(),
        currentAmount: currentAmount.toString(),
        deadline: deadline.toISOString().split('T')[0],
        daysRemaining: daysRemaining.toString(),
        currentBalance: currentBalance.toString(),
        avgMonthlySpend: avgMonthlySpend.toString(),
        avgMonthlyIncome: avgMonthlyIncome.toString(),
        period,
      });

      const response = await this.callOpenAI(prompt, undefined, true);
      const parsed = JSON.parse(response);

      return {
        suggestedAmount: parsed.suggestedAmount || targetAmount / (daysRemaining / 30),
        reasoning: parsed.reasoning || 'Based on your spending habits and goal timeline.',
      };
    } catch (error) {
      console.error('AI goal suggestion error:', error);
      // Fallback to mock
      return mocks.mockSuggestSavingsAmount(
        targetAmount,
        currentAmount,
        daysRemaining,
        avgMonthlyIncome,
        avgMonthlySpend
      );
    }
  }
}

export const aiAdapter = new AIAdapter();

