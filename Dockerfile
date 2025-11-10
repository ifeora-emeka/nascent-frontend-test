FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/ ./server/

RUN npm install --production

EXPOSE 8080

CMD ["npm", "run", "start:server"]
