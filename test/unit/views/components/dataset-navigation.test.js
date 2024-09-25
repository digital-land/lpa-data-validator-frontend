import { describe, it, expect } from 'vitest'
import jsdom from 'jsdom'
import { setupNunjucks } from '../../../../src/serverSetup/nunjucks.js'

describe('Dataset Navigation component', () => {
  const params = {
    organisation: {
      name: 'Mock org',
      organisation: 'mock-org'
    },
    dataset: {
      dataset: 'world-heritage-site-buffer-zone',
      name: 'World heritage site buffer zone'
    },
    issueCount: 0
  }

  const htmlString = `
    {% from "components/dataset-navigation.html" import datasetNavigation %}
    {{ datasetNavigation({
      active: "dataset-overview",
      dataset: dataset,
      organisation: organisation,
      issue_count: issueCount
    }) }}
  `

  const nunjucks = setupNunjucks({ datasetNameMapping: new Map() })
  const html = nunjucks.renderString(htmlString, params)
  const dom = new jsdom.JSDOM(html)
  const document = dom.window.document

  it('Renders the dataset navigation links correctly', () => {
    const links = document.querySelectorAll('.app-c-dataset-navigation .govuk-service-navigation__link')
    const activeLink = document.querySelector('.app-c-dataset-navigation .govuk-service-navigation__item.govuk-service-navigation__item--active')
    const issueCount = document.querySelector('.app-c-dataset-navigation .govuk-service-navigation__item.govuk-service-navigation__item--active .govuk-tag')

    expect(document.querySelector('.app-c-dataset-navigation')).not.toBeNull()
    expect(activeLink.textContent).toContain('Dataset overview')
    expect(links.length).toEqual(2)
    expect(issueCount).toBeNull()
  })

  it('Renders the active dataset navigation links correctly', () => {
    const htmlString = `
      {% from "components/dataset-navigation.html" import datasetNavigation %}
      {{ datasetNavigation({
        active: "task-list",
        dataset: dataset,
        organisation: organisation,
        issue_count: issueCount
      }) }}
    `

    const htmlWithActiveLink = nunjucks.renderString(htmlString, params)
    const domWithActiveLink = new jsdom.JSDOM(htmlWithActiveLink)
    const documentWithActiveLink = domWithActiveLink.window.document
    const links = documentWithActiveLink.querySelectorAll('.app-c-dataset-navigation .govuk-service-navigation__link')
    const activeLink = documentWithActiveLink.querySelector('.app-c-dataset-navigation .govuk-service-navigation__item.govuk-service-navigation__item--active')

    expect(document.querySelector('.app-c-dataset-navigation')).not.toBeNull()
    expect(activeLink.textContent).toContain('Task list')
    expect(links.length).toEqual(2)
  })

  it('Renders the issue count correctly', () => {
    const paramsWithIssues = {
      ...params,
      issueCount: 3
    }
    const htmlString = `
      {% from "components/dataset-navigation.html" import datasetNavigation %}
      {{ datasetNavigation({
        active: "task-list",
        dataset: dataset,
        organisation: organisation,
        issue_count: issueCount
      }) }}
    `

    const htmlWithIssues = nunjucks.renderString(htmlString, paramsWithIssues)
    const domWithIssues = new jsdom.JSDOM(htmlWithIssues)
    const documentWithIssues = domWithIssues.window.document
    const links = documentWithIssues.querySelectorAll('.app-c-dataset-navigation .govuk-service-navigation__link')
    const activeLink = documentWithIssues.querySelector('.app-c-dataset-navigation .govuk-service-navigation__item.govuk-service-navigation__item--active')
    const issueCount = documentWithIssues.querySelector('.app-c-dataset-navigation .govuk-service-navigation__item.govuk-service-navigation__item--active .govuk-tag')

    expect(document.querySelector('.app-c-dataset-navigation')).not.toBeNull()
    expect(activeLink.textContent).toContain('Task list')
    expect(issueCount.textContent).toContain('3')
    expect(links.length).toEqual(2)
  })
})
