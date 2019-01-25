FROM node:lts-alpine

# cache dependencies when possible
COPY library/package.json /app/library/package.json
COPY library/package-lock.json /app/library/package-lock.json
WORKDIR /app/library
RUN npm install

COPY integration-tests/package.json /app/integration-tests/package.json
COPY integration-tests/package-lock.json /app/integration-tests/package-lock.json
WORKDIR /app/integration-tests
RUN npm install

COPY tests/package.json /app/tests/package.json
COPY tests/package-lock.json /app/tests/package-lock.json
WORKDIR /app/tests
RUN npm install

COPY library/ /app/library/
WORKDIR /app/library
RUN npm run build

COPY tests/ /app/tests/
WORKDIR /app/tests
RUN npm run test-no-build

COPY integration-tests/ /app/integration-tests/
WORKDIR /app/integration-tests

ENTRYPOINT [ "npx", "mocha", "--require", "ts-node/register", "--colors", "source/**/*.ts", "--timeout", "10000" ]
