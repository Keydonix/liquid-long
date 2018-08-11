FROM node:8-alpine

# cache dependencies when possible
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm install

COPY . /app/
RUN npm run prepublishOnly

ENTRYPOINT [ "npx", "mocha", "--colors", "output/integration-tests/**/*.js", "--timeout", "10000" ]
