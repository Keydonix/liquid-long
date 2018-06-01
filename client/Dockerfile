FROM node:8-alpine as builder

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm install

COPY source/ /app/source/
COPY scripts/ /app/scripts/
RUN npm run integrity

FROM nginx:alpine
COPY --from=builder /app/source/index.* /usr/share/nginx/html/
