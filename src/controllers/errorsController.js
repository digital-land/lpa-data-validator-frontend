'use strict'

import PageController from './pageController.js'

import { severityLevels, dataSubjects } from '../utils/utils.js'

class ErrorsController extends PageController {
  get (req, res, next) {
    const validationResult = req.sessionModel.get('validationResult')

    const { aggregatedIssues, issueCounts, missingColumns } = this.getAggregatedErrors(validationResult)

    const rows = Object.values(aggregatedIssues)

    req.form.options.rows = rows
    req.form.options.issueCounts = issueCounts
    req.form.options.missingColumns = missingColumns
    req.form.options.columnNames = rows.length > 0 ? Object.keys(rows[0]) : []

    const dataSetValue = req.sessionModel.get('dataset')

    // ToDo: optimise this
    for (const [key, value] of Object.entries(dataSubjects)) {
      for (const dataset of value.dataSets) {
        if (dataset.value === dataSetValue) {
          req.form.options.dataSubject = key
          req.form.options.dataset = dataset.text
        }
      }
    }

    super.get(req, res, next)
  }

  getAggregatedErrors (apiResponseData) {
    const aggregatedIssues = {}
    const issueCounts = {}

    apiResponseData['issue-log'].forEach(issue => {
      if (issue.severity === severityLevels.error) {
        const entryNumber = issue['entry-number']

        const rowValues = apiResponseData['converted-csv'][issue['line-number'] - 2]
        if (!(entryNumber in aggregatedIssues)) {
          aggregatedIssues[entryNumber] = Object.keys(rowValues).reduce((acc, originalColumnName) => {
            const mappedColumnName = this.lookupMappedColumnNameFromOriginal(originalColumnName, apiResponseData['column-field-log'])
            acc[mappedColumnName] = {
              issue: false,
              value: rowValues[originalColumnName]
            }
            return acc
          }, {})
        }

        if (entryNumber in aggregatedIssues) {
          const columnName = this.lookupMappedColumnNameFromOriginal(issue.field, apiResponseData['column-field-log'])
          aggregatedIssues[entryNumber][columnName] = {
            issue: {
              type: issue['issue-type'],
              description: issue.description
            },
            value: rowValues[issue.field]
          }
          const key = issue.field + '_' + issue['issue-type']
          if (issueCounts[key]) {
            issueCounts[key].count += 1
          } else {
            issueCounts[key] = {
              count: 1,
              type: issue['issue-type'],
              description: issue.description,
              field: issue.field
            }
          }
        }
      }
    })

    const missingColumns = []
    apiResponseData['column-field-log'].forEach(columnField => {
      if (columnField.missing) {
        missingColumns.push(columnField.field)
      }
    })

    return { aggregatedIssues, issueCounts, missingColumns }
  }

  lookupMappedColumnNameFromOriginal (originalColumnName, columnFieldLogs) {
    const columnFieldLog = columnFieldLogs.find(columnField => columnField.column === originalColumnName)
    let mappedColumnName = originalColumnName
    if (columnFieldLog) {
      mappedColumnName = columnFieldLog.field
    }
    return mappedColumnName
  }

  lookupOriginalColumnNameFromMapped (mappedColumnName, columnFieldLogs) {
    const columnFieldLog = columnFieldLogs.find(columnField => columnField.field === mappedColumnName)
    let originalColumnName = mappedColumnName
    if (columnFieldLog) {
      originalColumnName = columnFieldLog.column
    }
    return originalColumnName
  }
}

export default ErrorsController
