# Middleware Guidelines

This document outlines convetions/rules of thumb for adding new routes/middleware to the app.

Relevant modules: 
- [controllers/middleware.js](../src/controllers/middleware.js)
- [routes/schemas.js](../src/routes/schemas.js)
- [OrganisationsController.js](../src/controllers/OrganisationsController.js) - contains usage examples of the two above

## Middleware chains

We should aim to make routes use chains of middleware functions, so that the final middleware should look similar to the example below:

```javascript
const endpoint = [
    validateQueryParams,     // use schema to validate params, return 400 if invalid
    parallel(                // fetch independent pieces of data
        fetchOrganisation,
        fetchDataset,
    ),
    prepareTemplateParams,   // this updates the `req` with `templateParams
    renderPage
]
```

## Data Fetching

Most data fetches can be done using middleware created with `fetchOne` or `fetchMany` utility functions. See examples in the [OrganisationsController.js](../src/controllers/OrganisationsController.js) module. It's possible to override how `fetchOne` should behave in case of zero records returned (by default we short circuit the chain by responding with 404 error). We can also do conditional fetches (see the `fetchIf` function), prarallel fetches (see `parallel` function).

The data fetching middleware should focus on getting the data from external data source. Any additional transforms should be done in separate middlware functions. This makes it easy to test the transforms (no mocking required) and allows us just 'one way' to handle errors. The alternative is dozens of little functions, each with their own little quirks and error handling.

## Schemas

The [routes/schemas.js](../src/routes/schemas.js) module contains schemas for data that needs to be passed to the Nunjucks templates. In environments different than production and staging, 
the schemas are used to validate data passed to the templates. This allows us to spot 
obvious errors (e.g. when creating mock data in our tests).

The mentioned module contains a sort of 'registry' in `templateSchema`, which maps template name to a schema (this registry is used by `validateAndRender` function to look up a schema for given template).

Almost every middleware chain should include a function that sets `templateParams` on the `req` object. That function is the place where transforms of previously fetched data occurs. Example:

```javascript
req.templateParams = {
    organisation, req.organisation,
    dataset: req.dataset,
    issues: req.issues.map( (issue) => issue.name )
}
```