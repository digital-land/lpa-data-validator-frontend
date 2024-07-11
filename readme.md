# lpa-data-validator-frontend 

Project is a web application for TODO

# Dependencies

Below is a list of dependencies needed to develop, run and deploy the application.

<!--div class="" data-type="Dependency">
  Dependencies have the following format:
  <pre>
  - Dependency Name : string
    - Description: string // a sentence or two
    - Used for: string    // a sentence or two
    - Contact: string?     // email or username or full name of person responsible
  </pre>
</div -->

## Services

- AWS:
    - **Description**: Various cloud infrastructure products
    - **Used for**: Running the application and associated services.
- Redis
    - **Description**: An in memory key-value store
    - **Used for**: storing session info
    - **Contact**: string? // email or username or full name of person responsible
- Local Authorities API (external dependency)
    - **Description**: TODO
    - **Used for**: TODO
    - **Contact**: TODO

## API Keys/Secrets

- Github
    - **Description**: Source code hosting
    - **Used for**: Storing the code and as a dependency source of internal packages.
    - **Contact**: TODO
- Smartlook
    - **Description**: Web Analytics
    - **Used for**: Collecting _anonymised_ data on website usage
    - **Contact**: TODO

## Software

- Nodejs
    - **Description**: JS runtime
    - **Used for**: running the web application
- Wiremock
    - **Description**: Tool for mocking APIs. Allows to serve pre-baked data from a file/directory.
- Docker (for development)
    - **Description**: Container runtime
    - **Used for**: Running Redis container and 
- [GOV.UK Design System](https://design-system.service.gov.uk/)
    - **Description**: Design System
    - **Used for**: Making the UI consistent with other government services.

----

**NOTE** The below is in the process of being updated.

## Setup

- Install the node packages
    ```
    npm install
    ``` 
- setup husky pre-commit hooks
    ```
    npm run prepare
    ```
- compile scss file
    ```
    npm run scss
    ```

## Running the application
- Run the application
    ```
    npm run start
    ```
- Run the application in watch mode
    ```
    npm run start
    ```
- run the application, using a local api
    ```
    npm run start:local
    ```
- run the application, using a local api in watch mode
    ```
    npm run start:local:watch
    ```