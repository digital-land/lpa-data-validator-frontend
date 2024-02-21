'use strict'
import PageController from './pageController.js'
import config from '../../config/index.js'

import { severityLevels } from '../utils/utils.js'
import logger from '../utils/logger.js'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

class UploadController extends PageController {
  apiRoute = config.api.url + config.api.validationEndpoint

  async get (req, res, next) {
    req.form.options.validationError = this.validationErrorMessage
    const region = config.aws.region
    const bucket = config.aws.uploadBucket
    const key = randomUUID()
    res.locals.uploadKey = key
    res.locals.presignedUrl = await this.createPresignedUrlWithClient({ region, bucket, key })
    super.get(req, res, next)
  }

  async post (req, res, next) {
    super.post(req, res, next)
  }

  resetValidationErrorMessage () {
    this.validationErrorMessage = undefined
  }

  validationError (type, message, errorObject, req) {
    logger.error({ type, message, errorObject })
    req.body.validationResult = { error: true, message, errorObject }
    this.validationErrorMessage = message
  }

  static resultIsValid (validationResult) {
    return validationResult ? !validationResult.error : false
  }

  hasErrors () {
    return this.errorCount > 0
  }

  handleValidationResult (jsonResult, req) {
    if (jsonResult) {
      if (jsonResult.error) {
        this.validationError('apiError', jsonResult.message, {}, req)
      } else {
        try {
          this.errorCount = jsonResult['issue-log'].filter(issue => issue.severity === severityLevels.error).length + jsonResult['column-field-log'].filter(log => log.missing).length
          req.body.validationResult = jsonResult
        } catch (error) {
          this.validationError('apiError', 'Error parsing api response error count', error, req)
        }
      }
    } else {
      this.validationError('apiError', 'Nothing returned from the api', null, req)
    }
  }

  handleApiError (error, req) {
    logger.error('Error uploading file', error)

    if (error.code === 'ERR_BAD_REQUEST') {
      switch (error.response.status) {
        case 400:
          this.validationError('apiError', error.response.data.detail.errMsg, error, req)
          break
        case 404:
          this.validationError('apiError', 'Validation endpoint not found', error, req)
          break
        case 500:
          this.validationError('apiError', 'Internal Server Error', error, req)
          break
        case 504:
          this.validationError('apiError', 'Gateway Timeout', error, req)
          break
        default:
          this.validationError('apiError', 'Error uploading file', error, req)
      }
    } else if (error.code === 'ECONNREFUSED') { // this indicates the api is down
      this.validationError('apiError', 'Unable to reach the api', error, req)
    } else if (error.code === 'ECONNABORTED') { // this indicates the api is down
      this.validationError('apiError', 'Gateway Timeout', error, req)
    } else {
      this.validationError('apiError', 'Error uploading file', error, req)
    }
  }

  constructBaseFormData ({ dataset, dataSubject, organisation, sessionId, ipAddress }) {
    const formData = new FormData()
    formData.append('dataset', dataset)
    formData.append('collection', dataSubject)
    formData.append('organisation', organisation)
    formData.append('sessionId', sessionId)
    formData.append('ipAddress', ipAddress)

    return formData
  }

  createPresignedUrlWithClient = ({ region, bucket, key }) => {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(new S3Client(/*{s3ForcePathStyle: true}*/), command, { expiresIn: 3600 });
  }

}

export default UploadController
