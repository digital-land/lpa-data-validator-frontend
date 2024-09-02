import { describe, it, expect } from 'vitest'
import { setupNunjucks } from '../../src/serverSetup/nunjucks.js'
import { JSDOM } from 'jsdom'
import { runGenericPageTests } from './generic-page.js'

const nunjucks = setupNunjucks({ datasetNameMapping: new Map() })

describe('http-error.html', () => {
  const params = {
    organisation: {
      name: 'mock org',
      organisation: 'mock-org'
    },
    dataset: {
      name: 'mock-dataset'
    },
    errorData: {
      endpoint_url: 'https://example.com/data-url',
      http_status: 404,
      latest_log_entry_date: '2022-01-01T12:00:00Z',
      latest_200_date: '2022-01-02T12:00:00Z'
    }
  }

  const html = nunjucks.render('organisations/http-error.html', params)
  const dom = new JSDOM(html)
  const document = dom.window.document

  runGenericPageTests(html, {
    pageTitle: 'mock org - mock-dataset - Task list - Submit and update your planning data'
  })

  it('Renders the correct heading', () => {
    expect(document.querySelector('h2').textContent).toContain('Error accessing data URL')
  })

  it('Renders the error details summary list', () => {
    const summaryList = document.querySelector('.govuk-summary-list')
    const rows = [...summaryList.children]

    expect(rows.length).toBe(4)

    expect(rows[0].querySelector('.govuk-summary-list__key').textContent).toContain('Data URL')
    expect(rows[0].querySelector('.govuk-summary-list__value').innerHTML).toContain(params.errorData.endpoint_url)

    expect(rows[1].querySelector('.govuk-summary-list__key').textContent).toContain('HTTP status')
    expect(rows[1].querySelector('.govuk-summary-list__value').textContent).toContain(String(params.errorData.http_status))

    expect(rows[2].querySelector('.govuk-summary-list__key').textContent).toContain('Last attempted access')
    expect(rows[2].querySelector('.govuk-summary-list__value').textContent).toMatch(/\d{1,2} [A-Za-z]{3,9} \d{4} at \d{1,2}(am|pm)/)

    expect(rows[3].querySelector('.govuk-summary-list__key').textContent).toContain('Last successful access')
    expect(rows[3].querySelector('.govuk-summary-list__value').textContent).toMatch(/\d{1,2} [A-Za-z]{3,9} \d{4} at \d{1,2}(am|pm)/)
  })

  it('re-submit link points to get-started page', () => {
    const resubmitLink = document.querySelector('a.resubmit-link')
    expect(resubmitLink.getAttribute('href')).toBe(`/organisations/${params.organisation.organisation}/${params.dataset.name}/get-started`)
  })
})
