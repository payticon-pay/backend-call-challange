FROM node:20-alpine
WORKDIR /app

COPY ./index.js ./package.json ./package-lock.json ./
RUN npm ci 

CMD node index.js