import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useExpenses } from '../src/hooks/useExpenses'

const storageKey = 'expense-tracker-expenses'

describe('useExpenses', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReset()
    vi.mocked(localStorage.setItem).mockReset()
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockImplementation(() => undefined)
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  it('loads stored expenses and finishes loading', async () => {
    const saved = [{ id: 'saved', description: 'Tea', amount: 3, category: 'Food', date: '2024-01-01' }]
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(saved))

    const { result } = renderHook(() => useExpenses())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(localStorage.getItem).toHaveBeenCalledWith(storageKey)
    expect(result.current.expenses).toEqual(saved)
    expect(localStorage.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(saved))
  })

  it('handles malformed stored JSON and persists the empty list', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('{broken')
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { result } = renderHook(() => useExpenses())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(error).toHaveBeenCalledWith('Failed to load expenses:', expect.any(SyntaxError))
    expect(result.current.expenses).toEqual([])
    expect(localStorage.setItem).toHaveBeenCalledWith(storageKey, '[]')
  })

  it('adds, updates, deletes, and clears expenses while persisting each change', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let id = ''
    act(() => { id = result.current.addExpense(' Lunch ', 12, 'Food', '2024-02-01').id })
    await waitFor(() => expect(result.current.expenses).toHaveLength(1))
    expect(result.current.expenses[0]).toMatchObject({ id, description: 'Lunch', amount: 12 })

    act(() => result.current.updateExpense(id, { amount: 15, description: 'Dinner' }))
    await waitFor(() => expect(result.current.expenses[0]).toMatchObject({ amount: 15, description: 'Dinner' }))

    act(() => result.current.deleteExpense(id))
    await waitFor(() => expect(result.current.expenses).toEqual([]))
    act(() => result.current.clearAllExpenses())
    await waitFor(() => expect(localStorage.setItem).toHaveBeenLastCalledWith(storageKey, '[]'))
  })

  it('rejects invalid additions and updates', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(() => result.current.addExpense('', 0, 'Food', '2024-01-01')).toThrow('Description is required, Amount must be greater than zero')
    act(() => result.current.addExpense('Bus', 4, 'Transport', '2024-01-01'))
    await waitFor(() => expect(result.current.expenses).toHaveLength(1))
    const id = result.current.expenses[0].id

    expect(() => result.current.updateExpense(id, { amount: -1 })).toThrow('Amount must be greater than zero')
    expect(result.current.expenses[0].amount).toBe(4)
  })
})
