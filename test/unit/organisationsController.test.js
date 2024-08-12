import { describe, it, vi, expect, beforeEach } from 'vitest'
import organisationsController from '../../src/controllers/OrganisationsController.js'
import performanceDbApi from '../../src/services/performanceDbApi.js'
import datasette from '../../src/services/datasette.js'

vi.mock('../../src/services/performanceDbApi.js')
vi.mock('../../src/utils/utils.js', () => {
  return {
    dataSubjects: {}
  }
})

vi.mock('../../src/services/datasette.js', () => ({
  default: {
    runQuery: vi.fn()
  }
}))
vi.mock('../../src/utils/issueMessages/getDatasetTaskList.js')

describe('OrganisationsController.js', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('overview', () => {
    it('should render the overview page', async () => {
      const req = { params: { lpa: 'test-lpa' } }
      const res = { render: vi.fn() }
      const next = vi.fn()

      const expectedResponse = {
        name: 'Test LPA',
        datasets: {
          dataset1: { endpoint: 'https://example.com', issue: false, error: false },
          dataset2: { endpoint: null, issue: true, error: false },
          dataset3: { endpoint: 'https://example.com', issue: false, error: true }
        }
      }

      performanceDbApi.getLpaOverview = vi.fn().mockResolvedValue(expectedResponse)

      await organisationsController.getOverview(req, res, next)

      expect(res.render).toHaveBeenCalledTimes(1)
      expect(res.render).toHaveBeenCalledWith('organisations/overview.html', expect.objectContaining({
        organisation: { name: 'Test LPA' },
        datasets: expect.arrayContaining([
          { endpoint: 'https://example.com', issue: false, error: false, slug: 'dataset1' },
          { endpoint: null, issue: true, error: false, slug: 'dataset2' },
          { endpoint: 'https://example.com', issue: false, error: true, slug: 'dataset3' }
        ]),
        totalDatasets: 3,
        datasetsWithEndpoints: 2,
        datasetsWithIssues: 1,
        datasetsWithErrors: 1
      }))
    })

    it('should catch and pass errors to the next function', async () => {
      const req = { params: { lpa: 'test-lpa' } }
      const res = { }
      const next = vi.fn()

      const error = new Error('Test error')

      vi.mocked(performanceDbApi.getLpaOverview).mockRejectedValue(error)

      await organisationsController.getOverview(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('find', () => {
    it('should call render with the find page', async () => {
      const req = {}
      const res = { render: vi.fn() }
      const next = vi.fn()

      vi.mocked(datasette.runQuery).mockResolvedValue({ formattedData: [] })

      await organisationsController.getOrganisations(req, res, next)

      expect(res.render).toHaveBeenCalledTimes(1)
      expect(res.render).toHaveBeenCalledWith('organisations/find.html', expect.objectContaining({
        alphabetisedOrgs: {}
      }))
    })

    it('should correctly sort and restructure the data recieved from datasette, then pass it on to the template', async () => {
      const req = {}
      const res = { render: vi.fn() }
      const next = vi.fn()

      const datasetteResponse = [
        { name: 'Aardvark Healthcare', organisation: 'Aardvark Healthcare' },
        { name: 'Bath NHS Trust', organisation: 'Bath NHS Trust' },
        { name: 'Bristol Hospital', organisation: 'Bristol Hospital' },
        { name: 'Cardiff Health Board', organisation: 'Cardiff Health Board' },
        { name: 'Derbyshire Healthcare', organisation: 'Derbyshire Healthcare' },
        { name: 'East Sussex NHS Trust', organisation: 'East Sussex NHS Trust' }
      ]

      vi.mocked(datasette.runQuery).mockResolvedValue({ formattedData: datasetteResponse })

      await organisationsController.getOrganisations(req, res, next)

      expect(res.render).toHaveBeenCalledTimes(1)
      expect(res.render).toHaveBeenCalledWith('organisations/find.html', expect.objectContaining({
        alphabetisedOrgs: {
          A: [
            { name: 'Aardvark Healthcare', organisation: 'Aardvark Healthcare' }
          ],
          B: [
            { name: 'Bath NHS Trust', organisation: 'Bath NHS Trust' },
            { name: 'Bristol Hospital', organisation: 'Bristol Hospital' }
          ],
          C: [
            { name: 'Cardiff Health Board', organisation: 'Cardiff Health Board' }
          ],
          D: [
            { name: 'Derbyshire Healthcare', organisation: 'Derbyshire Healthcare' }
          ],
          E: [
            { name: 'East Sussex NHS Trust', organisation: 'East Sussex NHS Trust' }
          ]
        }
      }))
    })

    it('should catch errors and pass them onto the next function', async () => {
      const req = {}
      const res = {}
      const next = vi.fn()

      const error = new Error('Test error')

      vi.mocked(datasette.runQuery).mockRejectedValue(error)

      await organisationsController.getOrganisations(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('get-started', () => {
    it('should render the get-started template with the correct params', async () => {
      const req = { params: { lpa: 'example-lpa', dataset: 'example-dataset' } }
      const res = { render: vi.fn() }
      const next = vi.fn()

      datasette.runQuery.mockImplementation((query) => {
        if (query.includes('example-lpa')) {
          return {
            formattedData: [
              { name: 'Example LPA' }
            ]
          }
        } else if (query.includes('example-dataset')) {
          return {
            formattedData: [
              { name: 'Example Dataset' }
            ]
          }
        }
      })

      await organisationsController.getGetStarted(req, res, next)

      expect(res.render).toHaveBeenCalledTimes(1)
      expect(res.render).toHaveBeenCalledWith('organisations/get-started.html', {
        organisation: { name: 'Example LPA' },
        dataset: { name: 'Example Dataset' }
      })
    })

    it('should catch and pass errors to the next function', async () => {
      const req = { params: { lpa: 'example-lpa', dataset: 'example-dataset' } }
      const res = { render: vi.fn() }
      const next = vi.fn()

      // Mock the datasette.runQuery method to throw an error
      datasette.runQuery.mockImplementation(() => {
        throw new Error('example error')
      })

      await organisationsController.getGetStarted(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('dataset task list', () => {
    it('should call render with the datasetTaskList page', async () => {
      const req = { params: { lpa: 'example-lpa', dataset: 'example-dataset' } }
      const res = { render: vi.fn() }
      const next = vi.fn()

      vi.mocked(datasette.runQuery).mockResolvedValueOnce({
        formattedData: [{ name: 'Example Organisation' }]
      }).mockResolvedValueOnce({
        formattedData: [{ name: 'Example Dataset' }]
      })

      vi.mocked(performanceDbApi.getLpaDatasetIssues).mockResolvedValue([
        {
          issue: 'Example issue 1',
          issue_type: 'Example issue type 1',
          num_issues: 1,
          status: 'Error'
        }
      ])

      vi.mocked(performanceDbApi.getTaskMessage).mockReturnValueOnce('task message 1')

      await organisationsController.getDatasetTaskList(req, res, next)

      expect(res.render).toHaveBeenCalledTimes(1)
      expect(res.render).toHaveBeenCalledWith('organisations/datasetTaskList.html', {
        taskList: [{
          title: {
            text: 'task message 1'
          },
          href: '/organisations/example-lpa/example-dataset/Example issue type 1',
          status: {
            tag: {
              classes: 'govuk-tag--red',
              text: 'Error'
            }
          }
        }],
        organisation: { name: 'Example Organisation' },
        dataset: { name: 'Example Dataset' }
      })
    })

    it('should fetch the dataset tasks and correctly pass them on to the dataset task list page', async () => {
      const req = { params: { lpa: 'example-lpa', dataset: 'example-dataset' } }
      const res = { render: vi.fn() }
      const next = vi.fn()

      vi.mocked(datasette.runQuery).mockResolvedValueOnce({
        formattedData: [{ name: 'Example Organisation' }]
      }).mockResolvedValueOnce({
        formattedData: [{ name: 'Example Dataset' }]
      })

      vi.mocked(performanceDbApi.getLpaDatasetIssues).mockResolvedValue([
        {
          issue: 'Example issue 1',
          issue_type: 'Example issue type 1',
          num_issues: 1,
          status: 'Error'
        },
        {
          issue: 'Example issue 2',
          issue_type: 'Example issue type 2',
          num_issues: 1,
          status: 'Needs fixing'
        }
      ])

      vi.mocked(performanceDbApi.getTaskMessage).mockReturnValueOnce('task message 1').mockReturnValueOnce('task message 2')

      await organisationsController.getDatasetTaskList(req, res, next)

      expect(res.render).toHaveBeenCalledTimes(1)
      expect(res.render).toHaveBeenCalledWith('organisations/datasetTaskList.html', {
        taskList: [
          {
            title: {
              text: 'task message 1'
            },
            href: '/organisations/example-lpa/example-dataset/Example issue type 1',
            status: {
              tag: {
                classes: 'govuk-tag--red',
                text: 'Error'
              }
            }
          },
          {
            title: {
              text: 'task message 2'
            },
            href: '/organisations/example-lpa/example-dataset/Example issue type 2',
            status: {
              tag: {
                classes: 'govuk-tag--yellow',
                text: 'Needs fixing'
              }
            }
          }
        ],
        organisation: { name: 'Example Organisation' },
        dataset: { name: 'Example Dataset' }
      })
    })

    it('should catch errors and pass them on to the next function', async () => {
      const req = { params: { lpa: 'example-lpa', dataset: 'example-dataset' } }
      const res = {}
      const next = vi.fn()

      // Mock the datasette.runQuery method to throw an error
      datasette.runQuery.mockImplementation(() => {
        throw new Error('example error')
      })

      await organisationsController.getDatasetTaskList(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('issue details', () => {
    it('should call render with the issue details page and the correct params', async () => {
      const req = {
        params: {
          lpa: 'test-lpa',
          dataset: 'test-dataset',
          issue_type: 'test-issue-type',
          resourceId: 'test-resource-id',
          entityNumber: '1'
        }
      }
      const res = {
        render: vi.fn()
      }
      const next = vi.fn()

      vi.mocked(datasette.runQuery)
        .mockReturnValueOnce({ formattedData: [{ name: 'mock lpa' }] })
        .mockReturnValueOnce({ formattedData: [{ name: 'mock dataset' }] })

      vi.mocked(performanceDbApi.getLatestResource).mockResolvedValueOnce({ resource: 'mockResourceId' })

      const issues = [
        {
          entry_number: 0,
          field: 'start-date',
          value: '02-02-2022'
        }
      ]

      vi.mocked(performanceDbApi.getIssues).mockResolvedValueOnce(issues)

      vi.mocked(performanceDbApi.getTaskMessage).mockReturnValueOnce('mock task message 1')

      issues.forEach(issue => {
        vi.mocked(performanceDbApi.getTaskMessage).mockReturnValueOnce(`mockMessageFor: ${issue.entry_number}`)
      })

      vi.mocked(performanceDbApi.getEntry).mockResolvedValueOnce([
        {
          field: 'start-date',
          value: '02-02-2022'
        }
      ])

      await organisationsController.getIssueDetails(req, res, next)

      expect(res.render).toHaveBeenCalledTimes(1)
      expect(res.render).toHaveBeenCalledWith('organisations/issueDetails.html', {
        organisation: {
          name: 'mock lpa'
        },
        dataset: {
          name: 'mock dataset'
        },
        errorHeading: 'mock task message 1',
        issueItems: [
          {
            html: 'mockMessageFor: 0 in record 0',
            href: '/organisations/test-lpa/test-dataset/test-issue-type/0'
          }
        ],
        entry: {
          title: 'entry: 1',
          fields: [
            {
              key: { text: 'start-date' },
              value: { html: '02-02-2022' },
              classes: ''
            }
          ]
        }
      })
    })

    it('should catch errors and pass them onto the next function', async () => {
      const req = {
        params: {
          lpa: 'test-lpa',
          dataset: 'test-dataset',
          issue_type: 'test-issue-type',
          resourceId: 'test-resource-id',
          entityNumber: '1'
        }
      }
      const res = {
        render: vi.fn()
      }
      const next = vi.fn()

      vi.mocked(performanceDbApi.getLatestResource).mockRejectedValue(new Error('Test error'))

      await organisationsController.getIssueDetails(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
