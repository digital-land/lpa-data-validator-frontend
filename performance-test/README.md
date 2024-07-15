# Performance Tests for Publish Service

Uses Locust to performance test the Publish Service which makes use of the async request backend on the platform.

## Setup

Install dependencies with pip:

```
pip install -r requirements.txt
```

## Run

Simply run the whole backend by running `docker compose up -d` in the root directory of this repository.

Once that is running, you can run the performance test in UI or headless mode

### 1. UI

Run locust in this directory:

```
locust
```

Then access the locust UI in your browser: http://localhost:8089/

Once in the Locust UI, you can specify a number of parameters including the number of concurrent users, ramp up,
host and duration of a performance test run.


### 2. Headless

Locust can also be run without a UI (i.e. headless) which is useful for automated scenarios such as continuous 
integration.  When running the locust command, the test parameters can also be specified:

```
locust --headless --host http://localhost:8000 --users 50 --spawn-rate 20 --run-time 1m
```

Notice in the command above that the host is the base URL for the request-api, while the number of concurrent
users is 50, the ramp up is 20 users per second and the overall run time is 1 minute.

Locust will run a performance test using the provided parameters, print the results to stdout and then provide
an exit code based on whether the test succeeds.  Controlling the exit code is possible by adding an event handler
to the test code.  
See https://docs.locust.io/en/stable/running-without-web-ui.html#controlling-the-exit-code-of-the-locust-process for
more information.  This could be useful in a continuous integration scenario where a certain error percentile is to be
tolerated or where an average response time is deemed unacceptable.

## Development

If you ever need to make some changes to dependencies, then add these to the `requirements.in` file.  Make sure you're
using a virtual environment (e.g. `python -m venv venv`) and then pin the dependencies like so:

```
./venv/bin/pip-compile requirements.in
```

Note that if you've installed pip compile globally then you'll be able to just run the command like so:

```
pip-compile requirements.in
```

