## Nest Xchange
A NestJS currency converter application using Redis cache for exchange rates. 
It features:
- fetching currency exchange rate from public Monobank API
- scheduled and on-request exchange rate cache renewal 
- exponential backoff fetching retries
- handles both _direct_ and _double_ currency conversion

Make sure you have the following dependencies installed locally:
- Docker
- Node v18+

## Quick start
```bash
$ cd docker

# Populate default docker compose config
$ cp .env.example .env

# Run the app and dependencies
$ docker compose up -d
```

You should now have 3 containers running:
- `redis` - exchange rate cache
- `redis-commander` - an admin panel for redis insights
- `nest-app` - the prebuilt version of the nest app

To watch the app logs:
```bash
$ docker compose logs --follow nest
```

To look up the contents of the redis cache
- Open http://localhost:8081
- Default credentials are `admin`:`admin`

### Test conversion

To play around with conversion - send `POST` request at http://localhost:3000/convert. 

The accepted body format example:

```json
{
  "sourceCurrencyCode": "PLN",
  "targetCurrencyCode": "UAH",
  "amount": 1000
}
```

The complete list of the supported currency codes is in [currency-code.type.ts](src/currency/types/currency-code.type.ts)

The logic of conversion is implemented in the [conversion.service.ts](src/conversion/conversion.service.ts) and specked out in a [conversion.service.spec.ts](src/conversion/conversion.service.spec.ts) 

### Direct conversion example

Direct conversion request (1000 PLN → UAH):
```bash
curl --location 'http://localhost:3000/convert' \
--header 'Content-Type: application/json' \
--data '{
    "sourceCurrencyCode": "PLN",
    "targetCurrencyCode": "UAH",
    "amount": 1000
}'
```

Example response:
```json
{ 
  "tgtAmount": 9727, 
  "conversion": "direct"
}
```

### Double conversion example
Not all currency pairs have exchange rates available in the Monobank API. 
For example there are no exchange rates between `USD` and `PLN`. 
However, the app handles such conversion with an intermediate conversion to `UAH`, for which exchange rate is always available.

For example to convert 1000 USD → PLN it would:
- convert USD → UAH, and then
- convert UAH → PLN

Which app-wide is called _double_ conversion. 

Double conversion request (1000 USD → PLN):
```bash
curl --location 'http://localhost:3000/convert' \
--header 'Content-Type: application/json' \
--data '{
    "sourceCurrencyCode": "USD",
    "targetCurrencyCode": "PLN",
    "amount": 1000
}'
```

Example response:
```json
{
  "tgtAmount": 3953.12,
  "conversion": "double"
}
```

## Local development
To run the nest app locally, first stop the nest app in the container from the quick start:
```bash
$ docker compose up -d --scale nest=0
```

Install dependencies (in the root folder of the project):
```bash
$ npm i
```

Populate default _app_ config:
```bash
$ cp .env.example .env
```

Run the app:
```bash
$ npm run start
```

## Caching
Renewing exchange rates cache is done in the following cases:
- initially on app startup
- every X min in a scheduled task (by default every 10 min)
- on request using a secret key via endpoint `/ding-ding` 🤫
- when the app downloaded fresh exchange rates during `/convert` request

Cache TTL is 15 min by default

## Test

The app has critical logic covered by unit tests. The most important is [conversion.service.spec.ts](src/conversion/conversion.service.spec.ts)

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
