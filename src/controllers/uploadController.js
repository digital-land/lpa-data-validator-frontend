'use strict'
import multer from 'multer'
import axios from 'axios'
import { readFile } from 'fs/promises'
import { lookup } from 'mime-types'
import PageController from './pageController.js'
import config from '../../config/index.js'

import { severityLevels } from '../utils/utils.js'
import logger from '../utils/logger.js'
import hash from '../utils/hasher.js'

const upload = multer({ dest: 'uploads/' })

const apiRoute = config.api.url + config.api.validationEndpoint

class UploadController extends PageController {
  middlewareSetup () {
    super.middlewareSetup()
    this.use('/upload', upload.single('datafile'))
  }

  async post (req, res, next) {
    if (req.file !== undefined) {
      req.body.datafile = req.file
      let jsonResult = {}
      try {
        jsonResult = await this.validateFile({
          filePath: req.file.path,
          fileName: req.file.originalname,
          dataset: req.sessionModel.get('dataset'),
          dataSubject: req.sessionModel.get('data-subject'),
          organisation: 'local-authority-eng:CAT', // ToDo: this needs to be dynamic, not collected in the prototype, should it be?
          sessionId: await hash(req.sessionID),
          ipAddress: await hash(req.ip)
        })
        if (jsonResult) {
          try {
            this.errorCount = jsonResult['issue-log'].filter(issue => issue.severity === severityLevels.error).length + jsonResult['column-field-log'].filter(log => log.missing).length
            req.body.validationResult = jsonResult
          } catch (error) {
            logger.error({ type: 'Upload', message: 'error parsing api response error count', error })
          }
        } else {
          logger.error({ type: 'filetype', message: 'invalid file type uploaded' })
        }
      } catch (error) {
        logger.error({ type: 'Upload', message: 'Error uploading file', error })
      }
    }
    super.post(req, res, next)
  }

  async validateFile ({ filePath, fileName, dataset, dataSubject, organisation, sessionId, ipAddress }) {
    const validFileType = UploadController.validateFileType({ originalname: fileName })

    if (!validFileType) {
      return false
    }

    const formData = new FormData()
    formData.append('dataset', dataset)
    formData.append('collection', dataSubject)
    formData.append('organisation', organisation)
    formData.append('sessionId', sessionId)
    formData.append('ipAddress', ipAddress)

    const file = new Blob([await readFile(filePath)], { type: lookup(filePath) })

    formData.append('upload_file', file, fileName)

    const result = await axios.post(apiRoute, formData)

    return result.data
  }

  // this function is a validation function that is called by the form wizard
  static validateFileType ({ originalname }) {
    const allowedFiletypes = [
      'csv',
      'xls',
      'xlsx',
      'json',
      'geojson',
      'gml',
      'gpkg'
    ]
    // check file type
    const fileType = originalname.split('.').pop()
    if (!allowedFiletypes.includes(fileType)) {
      return false
    }
    return true
  }

  hasErrors () {
    return this.errorCount > 0
  }
}

export default UploadController
