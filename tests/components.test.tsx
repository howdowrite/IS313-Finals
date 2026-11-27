import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpenseFilter } from '../src/components/ExpenseFilter'
import { ExpenseForm } from '../src/components/ExpenseForm'
import { ExpenseList } from '../src/components/ExpenseList'
import { SummaryCards } from '../src/components/SummaryCards'
import type { Expense } from '../src/utils/expenseCalculator'

const addExpense = vi.fn()
const deleteExpense = vi.fn()
vi.mock('../src/hooks/useExpenses', () => ({
  useExpenses: () => ({ addExpense, deleteExpense }),
}))

const expenses: Expense[] = [
  { id: '1', description: 'Lunch', amount: 12.5, category: 'Food', date: '2024-01-15' },
  { id: '2', description: 'Bus fare', amount: 3, category: 'Transport', date: '2024-02-02' },
]

describe('ExpenseForm', () => {
  beforeEach(() => addExpense.mockReset())

  it('submits entered values and resets the form', () => {
    addExpense.mockReturnValue(expenses[0])
    render(<ExpenseForm />)
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Coffee' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '4.25' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } })
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-01-10' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Add Expense' }).closest('form')!, { preventDefault: () => undefined })

    expect(addExpense).toHaveBeenCalledWith('Coffee', 4.25, 'Other', '2024-01-10')
    expect(screen.getByLabelText('Description')).toHaveValue('')
    expect(screen.getByLabelText('Amount')).toHaveValue(null)
    expect(screen.getByLabelText('Category')).toHaveValue('Food')
  })

  it('clears a previous error when a later submission succeeds', () => {
    addExpense.mockImplementationOnce(() => { throw new Error('Rejected test submission') }).mockReturnValue(expenses[0])
    render(<ExpenseForm />)
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Coffee' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '5' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Add Expense' }).closest('form')!, { preventDefault: () => undefined })
    expect(addExpense).toHaveBeenCalledTimes(1)
  })
})

describe('ExpenseFilter', () => {
  it('applies category and date filters, then clears them', () => {
    const onFilter = vi.fn()
    render(<ExpenseFilter expenses={expenses} onFilter={onFilter} />)
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Food' } })
    expect(onFilter).toHaveBeenLastCalledWith({ category: 'Food', startDate: '', endDate: '', search: '' })

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2024-01-20' } })
    expect(onFilter).toHaveBeenLastCalledWith({ category: 'Food', startDate: '2024-01-20', endDate: '', search: '' })
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expect(onFilter).toHaveBeenLastCalledWith({ category: 'All', startDate: '', endDate: '', search: '' })
    expect(screen.getByLabelText('Category')).toHaveValue('All')
    expect(screen.getByLabelText('From')).toHaveValue('')
    expect(screen.getByLabelText('Search expenses')).toHaveValue('')
  })

  it('searches descriptions without regard to capitalization and combines search with other filters', () => {
    const onFilter = vi.fn()
    render(<ExpenseFilter expenses={expenses} onFilter={onFilter} />)
    fireEvent.change(screen.getByLabelText('Search expenses'), { target: { value: 'LUNCH' } })
    expect(onFilter).toHaveBeenLastCalledWith({ category: 'All', startDate: '', endDate: '', search: 'LUNCH' })

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Transport' } })
    expect(onFilter).toHaveBeenLastCalledWith({ category: 'Transport', startDate: '', endDate: '', search: 'LUNCH' })

    fireEvent.change(screen.getByLabelText('Search expenses'), { target: { value: '' } })
    expect(onFilter).toHaveBeenLastCalledWith({ category: 'Transport', startDate: '', endDate: '', search: '' })
  })
})

describe('ExpenseList', () => {
  beforeEach(() => deleteExpense.mockReset())

  it('renders expense details and deletes the selected expense', () => {
    render(<ExpenseList expenses={[expenses[0]]} />)
    expect(screen.getByText('$12.50')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Lunch' }))
    expect(deleteExpense).toHaveBeenCalledWith('1')
  })

  it('shows the empty state', () => {
    render(<ExpenseList expenses={[]} />)
    expect(screen.getByText('No expenses yet. Add your first expense above!')).toBeInTheDocument()
  })

  it('shows a filter-specific empty state when no expenses match', () => {
    render(<ExpenseList expenses={[]} hasActiveFilters />)
    expect(screen.getByText('No expenses match your search and filters. Try adjusting them or clear filters.')).toBeInTheDocument()
  })
})

describe('SummaryCards', () => {
  it('shows totals, newest month, and non-empty categories', () => {
    render(<SummaryCards expenses={expenses} />)
    expect(screen.getByText('$15.50')).toBeInTheDocument()
    expect(screen.getByText('2 expenses')).toBeInTheDocument()
    expect(screen.getByText('This Month (2024-02)')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
  })

  it('shows empty summaries when there are no expenses', () => {
    render(<SummaryCards expenses={[]} />)
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    expect(screen.getByText('No expenses recorded')).toBeInTheDocument()
  })
})
