import { describe, it, expect } from 'vitest'
import jsdom from 'jsdom'
import { runGenericPageTests } from '../../generic-page.js'
import { stripWhitespace } from '../../../utils/stripWhiteSpace.js'
import { setupNunjucks } from '../../../../src/serverSetup/nunjucks.js'

describe('Dataset Overview Page', () => {
  const params = {
    organisation: {
      name: 'Mock org',
      organisation: 'mock-org'
    },
    dataset: {
      name: 'World heritage site buffer zone'
    },
    stats: {
      numberOfRecords: 10,
      numberOfFieldsSupplied: 5
    },
    geometries: []
  }

  const nunjucks = setupNunjucks({ datasetNameMapping: new Map() })
  const html = stripWhitespace(nunjucks.render('organisations/dataset-overview.html', params))

  const dom = new jsdom.JSDOM(html)
  const document = dom.window.document

  runGenericPageTests(html, {
    pageTitle: 'Mock org - World heritage site buffer zone - Dataset overview - Submit and update your planning data'
  })

  it('Renders the correct headings', () => {
    expect(document.querySelector('span.govuk-caption-xl').textContent).toEqual('Mock org')
    expect(document.querySelector('h1').textContent).toContain('World heritage site buffer zone')
  })

  it('Renders dataset details correctly', () => {
    expect(document.querySelector('h2.govuk-heading-m').textContent).toContain('Dataset details')
    const summaryListValues = document.querySelectorAll('dd.govuk-summary-list__value')
    expect(summaryListValues[0].textContent.trim()).toEqual('10')
    expect(summaryListValues[1].textContent.trim()).toEqual('5')
    expect(summaryListValues[2].textContent.trim()).toEqual('Open Government Licence')
  })

  it('Renders breadcrumbs correctly', () => {
    const breadcrumbs = document.querySelectorAll('.govuk-breadcrumbs__list-item')
    expect(breadcrumbs.length).toEqual(4)
    expect(breadcrumbs[0].textContent).toContain('Home')
    expect(breadcrumbs[1].textContent).toContain('Organisations')
    expect(breadcrumbs[2].textContent).toContain('Mock org')
    expect(breadcrumbs[3].textContent).toContain('World heritage site buffer zone')
  })

  it('Does not render the map section when geometries are absent', () => {
    expect(document.querySelector('#map')).toBeNull()
  })

  it('Renders the map section when geometries are present', () => {
    const paramsWithGeometries = {
      ...params,
      geometries: ['MULTIPOLYGON (((-0.1275 51.5072, -0.1275 51.5072, -0.1275 51.5072, -0.1275 51.5072)))']
    }
    const htmlWithGeometries = stripWhitespace(nunjucks.render('organisations/dataset-overview.html', paramsWithGeometries))
    const domWithGeometries = new jsdom.JSDOM(htmlWithGeometries)
    const documentWithGeometries = domWithGeometries.window.document

    expect(documentWithGeometries.querySelector('#map')).not.toBeNull()
    expect(documentWithGeometries.querySelector('script[src="/public/js/map.bundle.js"]')).not.toBeNull()
  })
})