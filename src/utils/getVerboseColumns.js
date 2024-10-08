/*
    This file is a utility function that processes a row and returns verbose rows using the column field log and row data.
*/
import logger from './logger.js'
import { types } from './logging.js'

/**
 * Returns an array of verbose column objects from a given row and column field log.
 *
 * If either the column field log or issue logs are missing, returns a fallback array
 * with warnings logged for missing data.
 *
 * @param {Object} row - The row object containing converted row data and issue logs.
 * @param {Object} columnFieldLog - The column field log object.
 * @returns {Array<Object>} An array of verbose column objects, each containing:
 *   - `key`: the column key
 *   - `value`: the column value
 *   - `column`: the column name
 *   - `field`: the field name
 *   - `error`: an error message if data was missing
 */
const getVerboseColumns = (row, columnFieldLog) => {
  if (!columnFieldLog || !row.issue_logs) {
    // if the["column-field-log"] or issue_logs are missing, return what we can
    const message = `missing row data: ${columnFieldLog ? '' : 'column-field-log'} ${row.issue_logs ? '' : 'row.issue_logs'}`
    logger.warn({ message, type: types.DataValidation })
    const validator = ([key, value]) => {
      return [key, { value, column: key, field: key, error: message }]
    }
    return Object.entries(row.converted_row).map(validator)
  }
  // Process the row and return verbose columns

  // This function processes a key-value pair and returns a verbose value
  const processKeyValue = (key, value, row, columnFieldLog) => {
    const columnField = columnFieldLog.find(column => column.column === key)
    const field = columnField ? columnField.field : key
    // If the column field is missing, set the error to 'missing value', otherwise find the error in issue_logs
    const error = columnField && columnField.missing ? 'missing value' : row.issue_logs.find(error => error.field === field)
    // Return the verbose value
    return [field, { value, column: key, field, error }]
  }

  const valuesAsArray = Object.entries(row.converted_row)
  const verboseValuesAsArray = valuesAsArray.map(([key, value]) => processKeyValue(key, value, row, columnFieldLog))

  // Reduce verbose values to handle duplicate keys
  return reduceVerboseValues(verboseValuesAsArray)
}

// This function reduces verbose values to handle duplicate keys
const reduceVerboseValues = (verboseValuesAsArray) => {
  return verboseValuesAsArray.reduce((acc, [key, value]) => {
    if (key in acc) {
      // If both the existing and new values are not null and they are different, log a message
      if (value.value && acc[key].value && value.value !== acc[key].value) {
        // ToDo: we need to handle this case
        logger.warn(`Duplicate keys with different values: ${key}`, { type: types.DataValidation })
        // If the new value is not null, replace the existing value and log a message
      } else if (value.value) {
        acc[key] = value
        logger.debug(`Duplicate key found, keeping the one with value: ${key}`)
      }
      // If the key does not exist in the accumulator, add it
    } else {
      acc[key] = value
    }
    // Return the accumulator
    return acc
  }, {})
}

export { getVerboseColumns }
