'use strict'

import PageController from './pageController.js'

import { severityLevels, dataSubjects } from '../utils/utils.js'

class ErrorsController extends PageController {
  locals (req, res, next) {
    const validationResult = req.sessionModel.get('validationResult')

    const { aggregatedIssues } = this.getAggregatedErrors(validationResult)

    const rows = Object.values(aggregatedIssues)

    req.form.options.rows = rows
    req.form.options.errorSummary = validationResult['error-summary']
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
    super.locals(req, res, next)
  }

  getAggregatedErrors (apiResponseData) {
    const aggregatedIssues = {}

    apiResponseData['issue-log'].forEach(issue => {
      if (issue.severity === severityLevels.error) {
        const entryNumber = issue['entry-number']
        const rowValues = { ...apiResponseData['converted-csv'][issue['line-number'] - 2] }

        // remove any keys from row values where a mapping exists to this column
        Object.keys(rowValues).forEach(originalColumnName => {
          // if a mapping exists to this column name, remove it from the row values
          const mappingToThisColumn = apiResponseData['column-field-log'].find(columnField => columnField.field === originalColumnName)
          if (mappingToThisColumn) {
            const mappingExistsInRowValues = mappingToThisColumn.field !== mappingToThisColumn.column && Object.keys(rowValues).includes(mappingToThisColumn.column)
            if (mappingExistsInRowValues) {
              delete rowValues[originalColumnName]
            }
          }
        })

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
          const columnName = this.lookupOriginalColumnNameFromMapped(issue.field, apiResponseData['column-field-log'])

          aggregatedIssues[entryNumber][issue.field] = {
            issue: {
              type: issue['issue-type'],
              description: issue.message
            },
            value: rowValues[columnName]
          }
        }
      }
    })

    return { aggregatedIssues }
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
