FROM node:8

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm install

COPY . /app/
WORKDIR /app/scripts
ENTRYPOINT [ "npx", "ts-node" ]
CMD [ "seed-oasis.ts" ]
