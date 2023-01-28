# Taken from https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:18
# Create app directory
WORKDIR /app/nodejs/roliscraper

# Copy and download dependencies
COPY /JS/package*.json ./
# COPY package*.json ./
RUN npm install

COPY . .
ENTRYPOINT ["/JS"]
CMD [ "node", "index.js" ]
