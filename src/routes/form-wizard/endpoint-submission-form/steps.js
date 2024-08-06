import chooseDatasetController from '../../../controllers/chooseDatasetController.js'
import LpaDetailsController from '../../../controllers/lpaDetailsController.js'
import PageController from '../../../controllers/pageController.js'
import confirmationController from '../../../controllers/confirmationController.js'

const defaultParams = {
  entryPoint: false,
  controller: PageController
}

export default {
  '/': {
    ...defaultParams,
    entryPoint: true,
    resetJourney: true,
    template: 'submit/start.html',
    next: '/submit/lpa-details'
  },
  '/lpa-details': {
    ...defaultParams,
    fields: ['lpa', 'name', 'email'],
    next: 'choose-dataset',
    controller: LpaDetailsController,
    backLink: '/start'
  },
  '/choose-dataset': {
    ...defaultParams,
    fields: ['dataset'],
    next: 'dataset-details',
    controller: chooseDatasetController,
    backLink: '/lpa-details'
  },
  '/dataset-details': {
    ...defaultParams,
    fields: ['endpoint-url', 'documentation-url', 'hasLicence'],
    next: 'check-answers',
    backLink: '/choose-dataset'
  },
  '/check-answers': {
    ...defaultParams,
    next: 'confirmation',
    backLink: '/dataset-details'
  },
  '/confirmation': {
    ...defaultParams,
    controller: confirmationController,
    template: 'submit/confirmation.html'
  }
}
