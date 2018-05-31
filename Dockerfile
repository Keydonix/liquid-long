FROM node:8

# cache dependencies when possible
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm install

COPY deployment/ /app/deployment/
COPY contracts/ /app/contracts/
WORKDIR /app

ENTRYPOINT [ "npx", "ts-node", "--project", "deployment/tsconfig.json", "deployment/scripts/deploy.ts" ]