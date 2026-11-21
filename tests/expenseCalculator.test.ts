import { describe, it, expect } from 'vitest';
import {
  calculateTotal,
  calculateByCategory,
  filterByDateRange,
  validateExpenseInput,
  getMonthlyTotals,
  getMonthlyTotalsArray,
  createExpense,
  generateId,
  Expense,
  Category
} from '../src/utils/expenseCalculator';

// Sample test data
const sampleExpenses: Expense[] = [
  { id: '1', description: 'Lunch', amount: 15.50, category: 'Food', date: '2024-01-15' },
  { id: '2', description: 'Bus fare', amount: 2.50, category: 'Transport', date: '2024-01-16' },
  { id: '3', description: 'Movie', amount: 25.00, category: 'Entertainment', date: '2024-01-20' },
  { id: '4', description: 'Groceries', amount: 85.00, category: 'Food', date: '2024-02-05' },
  { id: '5', description: 'Electric bill', amount: 120.00, category: 'Utilities', date: '2024-02-10' },
  { id: '6', description: 'Coffee', amount: 5.00, category: 'Food', date: '2024-02-15' },
];

describe('Expense Calculator - Core Business Logic', () => {

  // ============================================
  // TEST 1: Valid Input - Normal total calculation
  // ============================================
  describe('calculateTotal', () => {
    it('returns correct sum for valid expenses', () => {
      const total = calculateTotal(sampleExpenses);
      // 15.50 + 2.50 + 25.00 + 85.00 + 120.00 + 5.00 = 253.00
      expect(total).toBe(253.00);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0);
    });

    it('handles single expense', () => {
      expect(calculateTotal([{
        id: '1', description: 'Test', amount: 100, category: 'Food', date: '2024-01-01'
      }])).toBe(100);
    });

    it('handles decimal precision correctly', () => {
      const expenses: Expense[] = [
        { id: '1', description: 'A', amount: 0.1, category: 'Food', date: '2024-01-01' },
        { id: '2', description: 'B', amount: 0.2, category: 'Food', date: '2024-01-01' },
      ];
      expect(calculateTotal(expenses)).toBeCloseTo(0.3, 10);
    });
  });

  // ============================================
  // TEST 2: Alternative Outcome - Category breakdown
  // ============================================
  describe('calculateByCategory', () => {
    it('groups amounts correctly by category', () => {
      const byCategory = calculateByCategory(sampleExpenses);
      expect(byCategory.Food).toBe(105.50);        // 15.50 + 85.00 + 5.00
      expect(byCategory.Transport).toBe(2.50);
      expect(byCategory.Entertainment).toBe(25.00);
      expect(byCategory.Utilities).toBe(120.00);
      expect(byCategory.Other).toBe(0);
    });

    it('returns zero for all categories when empty', () => {
      const result = calculateByCategory([]);
      expect(result.Food).toBe(0);
      expect(result.Transport).toBe(0);
      expect(result.Entertainment).toBe(0);
      expect(result.Utilities).toBe(0);
      expect(result.Other).toBe(0);
    });

    it('only includes categories that have expenses', () => {
      const foodOnly: Expense[] = [
        { id: '1', description: 'Lunch', amount: 20, category: 'Food', date: '2024-01-01' },
      ];
      const result = calculateByCategory(foodOnly);
      expect(result.Food).toBe(20);
      expect(result.Transport).toBe(0);
    });
  });

  // ============================================
  // TEST 3: Invalid Input / Boundary - Validation
  // ============================================
  describe('validateExpenseInput', () => {
    it('rejects empty input with all required field errors', () => {
      const result = validateExpenseInput({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description is required');
      expect(result.errors).toContain('Amount is required');
      expect(result.errors).toContain('Category is required');
      expect(result.errors).toContain('Date is required');
    });

    it('rejects negative amount', () => {
      const result = validateExpenseInput({
        description: 'Test',
        amount: -10,
        category: 'Food',
        date: '2024-01-01'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than zero');
    });

    it('rejects zero amount', () => {
      const result = validateExpenseInput({
        description: 'Test',
        amount: 0,
        category: 'Food',
        date: '2024-01-01'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than zero');
    });

    it('rejects invalid category', () => {
      const result = validateExpenseInput({
        description: 'Test',
        amount: 10,
        category: 'InvalidCategory' as Category,
        date: '2024-01-01'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid category. Must be one of: Food, Transport, Entertainment, Utilities, Other');
    });

    it('rejects future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const result = validateExpenseInput({
        description: 'Test',
        amount: 10,
        category: 'Food',
        date: futureDateStr
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date cannot be in the future');
    });

    it('rejects invalid date format', () => {
      const result = validateExpenseInput({
        description: 'Test',
        amount: 10,
        category: 'Food',
        date: '01-01-2024'  // Wrong format
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date must be in YYYY-MM-DD format');
    });

    it('rejects description too long', () => {
      const result = validateExpenseInput({
        description: 'a'.repeat(101),
        amount: 10,
        category: 'Food',
        date: '2024-01-01'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description must be 100 characters or less');
    });

    it('accepts valid input', () => {
      const result = validateExpenseInput({
        description: 'Valid Expense',
        amount: 10.50,
        category: 'Food',
        date: '2024-01-01'
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts all valid categories', () => {
      const categories: Category[] = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Other'];
      categories.forEach(cat => {
        const result = validateExpenseInput({
          description: 'Test',
          amount: 10,
          category: cat,
          date: '2024-01-01'
        });
        expect(result.valid).toBe(true);
      });
    });
  });

  // ============================================
  // TEST 4: Date Range Filtering (Bonus)
  // ============================================
  describe('filterByDateRange', () => {
    it('returns expenses within date range (inclusive)', () => {
      const janExpenses = filterByDateRange(sampleExpenses, '2024-01-01', '2024-01-31');
      expect(janExpenses).toHaveLength(3);
      expect(janExpenses.every(e => e.date.startsWith('2024-01'))).toBe(true);
    });

    it('includes expenses on start and end dates', () => {
      const expenses: Expense[] = [
        { id: '1', description: 'Start', amount: 10, category: 'Food', date: '2024-01-01' },
        { id: '2', description: 'End', amount: 20, category: 'Food', date: '2024-01-31' },
      ];
      const result = filterByDateRange(expenses, '2024-01-01', '2024-01-31');
      expect(result).toHaveLength(2);
    });

    it('returns empty array for non-overlapping range', () => {
      const result = filterByDateRange(sampleExpenses, '2024-03-01', '2024-03-31');
      expect(result).toHaveLength(0);
    });

    it('handles partial month range', () => {
      const result = filterByDateRange(sampleExpenses, '2024-01-16', '2024-02-05');
      expect(result).toHaveLength(3); // Bus fare (16th), Movie (20th), Groceries (5th)
    });
  });

  // ============================================
  // TEST 5: Monthly Totals (Bonus)
  // ============================================
  describe('getMonthlyTotals', () => {
    it('groups by year-month correctly', () => {
      const monthly = getMonthlyTotals(sampleExpenses);
      expect(monthly['2024-01']).toBe(43.00);  // 15.50 + 2.50 + 25.00
      expect(monthly['2024-02']).toBe(210.00); // 85.00 + 120.00 + 5.00
    });

    it('returns empty object for empty array', () => {
      expect(getMonthlyTotals([])).toEqual({});
    });

    it('handles single month', () => {
      const expenses: Expense[] = [
        { id: '1', description: 'A', amount: 100, category: 'Food', date: '2024-03-15' },
      ];
      expect(getMonthlyTotals(expenses)).toEqual({ '2024-03': 100 });
    });
  });

  describe('getMonthlyTotalsArray', () => {
    it('returns sorted array with most recent first', () => {
      const monthly = getMonthlyTotalsArray(sampleExpenses);
      expect(monthly).toHaveLength(2);
      expect(monthly[0].month).toBe('2024-02');
      expect(monthly[1].month).toBe('2024-01');
      expect(monthly[0].total).toBe(210.00);
      expect(monthly[1].total).toBe(43.00);
    });
  });

  // ============================================
  // TEST 6: createExpense & generateId (Bonus)
  // ============================================
  describe('createExpense', () => {
    it('creates valid expense with generated ID', () => {
      const { expense, validation } = createExpense('Lunch', 15.50, 'Food', '2024-01-15');
      expect(validation.valid).toBe(true);
      expect(expense).not.toBeNull();
      expect(expense?.description).toBe('Lunch');
      expect(expense?.amount).toBe(15.50);
      expect(expense?.category).toBe('Food');
      expect(expense?.date).toBe('2024-01-15');
      expect(expense?.id).toMatch(/^\d+-[a-z0-9]+$/); // timestamp-random format
    });

    it('returns validation error for invalid input', () => {
      const { expense, validation } = createExpense('', -5, 'Food', '2024-01-15');
      expect(validation.valid).toBe(false);
      expect(expense).toBeNull();
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('trims description whitespace', () => {
      const { expense } = createExpense('  Lunch  ', 10, 'Food', '2024-01-01');
      expect(expense?.description).toBe('Lunch');
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('generates IDs with timestamp prefix', () => {
      const id = generateId();
      const timestampPart = id.split('-')[0];
      expect(parseInt(timestampPart)).toBeGreaterThan(0);
    });
  });
});