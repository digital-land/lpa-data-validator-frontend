import performanceDbApi from '../services/performanceDbApi.js'
import { fetchDatasetInfo, fetchEntityCount, fetchIssueEntitiesCount, fetchIssues, fetchLatestResource, fetchOrgInfo, formatErrorSummaryParams, isResourceIdInParams, logPageError, reformatIssuesToBeByEntryNumber, takeResourceIdFromParams, validateQueryParams } from './common.middleware.js'
import { fetchIf, parallel, renderTemplate } from './middleware.builders.js'
import * as v from 'valibot'
import { pagination } from '../utils/pagination.js'

export const IssueDetailsQueryParams = v.object({
  lpa: v.string(),
  dataset: v.string(),
  issue_type: v.string(),
  issue_field: v.string(),
  pageNumber: v.optional(v.string()),
  resourceId: v.optional(v.string())
})

const validateIssueDetailsQueryParams = validateQueryParams.bind({
  schema: IssueDetailsQueryParams
})

/**
 *
 * Middleware. Updates `req` with `entryData`
 *
 * Requires `pageNumber`, `dataset` and
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 */
async function fetchEntry (req, res, next) {
  const { dataset: datasetId, entryNumber } = req.params

  req.entryData = await performanceDbApi.getEntry(
    req.resource.resource,
    entryNumber,
    datasetId
  )

  next()
}

/**
 *
 * @param {string} errorMessage
 * @param {{value: string}?} issue
 * @returns {string}
 */
const issueErrorMessageHtml = (errorMessage, issue) =>
    `<p class="govuk-error-message">${errorMessage}</p>${
      issue ? issue.value ?? '' : ''
    }`

/**
 *
 * @param {*} text
 * @param {*} html
 * @param {*} classes
 * @returns {{key: {text: string}, value: { html: string}, classes: string}}
 */
const getIssueField = (text, html, classes) => {
  return {
    key: {
      text
    },
    value: {
      html
    },
    classes
  }
}

/**
 *
 * @param {*} issueType
 * @param {*} issuesByEntryNumber
 * @param {*} row
 * @returns {{key: {text: string}, value: { html: string}, classes: string}}
 */
const processEntryRow = (issueType, issuesByEntryNumber, row) => {
  const { entry_number: entryNumber } = row
  console.assert(entryNumber, 'precessEntryRow(): entry_number not in row')

  issuesByEntryNumber = issuesByEntryNumber || {}

  let hasError = false
  let issueIndex
  if (issuesByEntryNumber[entryNumber]) {
    issueIndex = issuesByEntryNumber[entryNumber].findIndex(
      (issue) => issue.field === row.field
    )
    hasError = issueIndex >= 0
  }

  let valueHtml = ''
  let classes = ''
  if (hasError) {
    const message =
        issuesByEntryNumber[entryNumber][issueIndex].message || issueType
    valueHtml += issueErrorMessageHtml(message, null)
    classes += 'dl-summary-card-list__row--error'
  }
  valueHtml += row.value

  return getIssueField(row.field, valueHtml, classes)
}

/***
 * Middleware. Updates req with `templateParams`
 */
export function prepareIssueDetailsTemplateParams (req, res, next) {
  const { entryData, issueEntitiesCount, issuesByEntryNumber, errorSummary } = req
  const { lpa, dataset: datasetId, issue_type: issueType, issue_field: issueField, entryNumber } = req.params

  const BaseSubpath = `/organisations/${lpa}/${datasetId}/${issueType}/${issueField}/entry/`

  const fields = entryData.map((row) => processEntryRow(issueType, issuesByEntryNumber, row))
  const entityIssues = issuesByEntryNumber[entryNumber] || []
  for (const issue of entityIssues) {
    if (!fields.find((field) => field.key.text === issue.field)) {
      const errorMessage = issue.message || issueType
      // TODO: pull the html out of here and into the template
      const valueHtml = issueErrorMessageHtml(errorMessage, issue.value)
      const classes = 'dl-summary-card-list__row--error'

      fields.push(getIssueField(issue.field, valueHtml, classes))
    }
  }

  const geometries = entryData
    .filter((row) => row.field === 'geometry')
    .map((row) => row.value)
  const entry = {
    title: `entry: ${entryNumber}`,
    fields,
    geometries
  }

  const paginationObj = {
    items: []
  }

  const entryNumbers = Object.keys(issuesByEntryNumber)
  const pageNumber = entryNumbers.findIndex(currentEntryNumber => currentEntryNumber === entryNumber) + 1

  if (pageNumber > 1) {
    paginationObj.previous = {
      href: `${BaseSubpath}${entryNumbers[pageNumber - 1]}`
    }
  }

  if (pageNumber < issueEntitiesCount) {
    paginationObj.next = {
      href: `${BaseSubpath}${entryNumbers[pageNumber + 1]}`
    }
  }

  paginationObj.items = pagination(issueEntitiesCount, pageNumber).map(item => {
    if (item === '...') {
      return {
        type: 'ellipsis',
        ellipsis: true,
        href: '#'
      }
    } else {
      return {
        type: 'number',
        number: item,
        href: `${BaseSubpath}${entryNumbers[item - 1]}`,
        current: pageNumber === parseInt(item)
      }
    }
  })

  // schema: OrgIssueDetails
  req.templateParams = {
    organisation: req.orgInfo,
    dataset: req.dataset,
    errorSummary,
    entry,
    issueType,
    issueField,
    pagination: paginationObj,
    issueEntitiesCount
  }

  next()
}

/**
 * Middleware. Renders the issue details page with the list of issues, entry data,
 * and organisation and dataset details.
 */
export const getIssueDetails = renderTemplate({
  templateParams: (req) => req.templateParams,
  template: 'organisations/issueDetails.html',
  handlerName: 'getIssueDetails'
})

export default [
  validateIssueDetailsQueryParams,
  fetchOrgInfo,
  fetchDatasetInfo,
  fetchIf(isResourceIdInParams, fetchLatestResource, takeResourceIdFromParams),
  fetchIssues,
  reformatIssuesToBeByEntryNumber,
  parallel([
    fetchEntry,
    fetchEntityCount,
    fetchIssueEntitiesCount
  ]),
  formatErrorSummaryParams,
  prepareIssueDetailsTemplateParams,
  getIssueDetails,
  logPageError
]
