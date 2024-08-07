import { vi, it, describe, expect } from 'vitest'
import datasette from '../../src/services/datasette.js'
import { fetchLocalAuthorities } from '../../src/utils/datasetteQueries/fetchLocalAuthorities'

// Mock datasette.runQuery to return a fake response
vi.mock('../../src/services/datasette.js', () => ({
  default: {
    runQuery: vi.fn()
  }
}))

describe('fetchLocalAuthorities', () => {
  it('should fetch local authority names', async () => {
    datasette.runQuery.mockResolvedValue({
      formattedData: [
        { name: 'Local Authority 1' },
        { name: 'Local Authority 2' },
        { name: 'Local Authority 3' }
      ]
    })
    const result = await fetchLocalAuthorities()
    expect(result).toEqual(['Local Authority 1', 'Local Authority 2', 'Local Authority 3'])
  })

  it('should throw an error if the HTTP request fails', async () => {
    datasette.runQuery.mockRejectedValue(new Error('Failed to fetch data'))
    await expect(fetchLocalAuthorities()).rejects.toThrow('Failed to fetch data')
  })

  it('should throw an error if data processing encounters an issue', async () => {
    datasette.runQuery.mockResolvedValue({
      formattedData: [
        { name: 'Local Authority 1' },
        { name: null }, // Simulate null value in the response
        { name: 'Local Authority 3' }
      ]
    })
    const result = await fetchLocalAuthorities()
    expect(result).toEqual(['Local Authority 1', 'Local Authority 3'])
  })
})
