# Edited ver of https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:18
# Create app directory
COPY . /app
WORKDIR /app/JS
RUN npm install
CMD node index.js
