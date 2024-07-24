import UploadController from './uploadController.js'
import { postUrlRequest } from '../utils/asyncRequestApi.js'
import { URL } from 'url'
import logger from '../utils/logger.js'
import axios from 'axios'
import { allowedFileTypes } from '../utils/utils.js'

class SubmitUrlController extends UploadController {
  async post (req, res, next) {
    const localValidationErrorType = await SubmitUrlController.localUrlValidation(req.body.url)

    if (localValidationErrorType) {
      const error = {
        key: 'url',
        type: localValidationErrorType
      }
      const errors = {
        url: new SubmitUrlController.Error(error.key, error, req, res)
      }
      logger.warn('SubmitUrlController: local validation failed during url submission', error)
      return next(errors)
    }

    try {
      const id = await postUrlRequest({ ...this.getBaseFormData(req), url: req.body.url })
      req.body.request_id = id
    } catch (error) {
      next(error)
      return
    }
    super.post(req, res, next)
  }

  static async localUrlValidation (url) {
    const validators = [
      { type: 'required', fn: () => SubmitUrlController.urlIsDefined(url) },
      { type: 'format', fn: () => SubmitUrlController.urlIsValid(url) },
      { type: 'length', fn: () => SubmitUrlController.urlIsNotTooLong(url) }
    ]

    const headRequest = await SubmitUrlController.getHeadRequest(url)

    if (headRequest) {
      validators.push(
        { type: 'exists', fn: () => SubmitUrlController.urlExists(headRequest) },
        { type: 'filetype', fn: () => SubmitUrlController.validateAcceptedFileType(headRequest) },
        { type: 'size', fn: () => SubmitUrlController.urlResponseIsNotTooLarge(headRequest) }
      )
    }

    return validators.find(validator => !validator.fn())?.type
  }

  static urlIsDefined (url) {
    return url !== '' && url !== undefined
  }

  static urlIsValid (url) {
    try {
      // eslint-disable-next-line no-new
      new URL(url)
      return true
    } catch (err) {
      return false
    }
  }

  static urlIsNotTooLong (url) {
    return url.length <= 2048
  }

  static async getHeadRequest(url) {
    try {
      return await axios.head(url);
    } catch (err) {
      if (err.code && ['ENOTFOUND', 'ECONNREFUSED'].includes(err.code)) {
        return null;
      }
  
      const response = err.response;
      if (response && response.status === 400) {
        return null;
      }
  
      // If err.response is not present or doesn't have a status property, return the entire error object
      return err;
    }
  }
  

  static urlResponseIsNotTooLarge (response) {
    try {
      const contentLength = response.headers['content-length']

      // Convert content length to MB
      const sizeInMB = contentLength / (1024 * 1024)

      return sizeInMB <= 10
    } catch (err) {
      console.warn(err)
      return true // for now we will allow this file as we can't be sure
    }
  }

  static urlExists (response) {
    if (!response) {
      return false
    }
    try {
      return (response.status >= 200 && response.status < 300) || response.status === 400 // need to add 400 as some servers return 400 for head requests
    } catch (err) {
      logger.warn(err)
      return true
    }
  }

  static validateAcceptedFileType (response) {
    try {
      const contentType = response.headers['content-type'].split(';')[0]
      const acceptedTypes = Object.values(allowedFileTypes).flat()
      return acceptedTypes.includes(contentType)
    } catch (err) {
      logger.warn(err)
      return false
    }
  }
}

export default SubmitUrlController
