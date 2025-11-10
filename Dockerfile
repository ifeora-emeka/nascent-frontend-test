FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY server/ ./server/

RUN npm install --production

EXPOSE 3001

CMD ["npm", "run", "start:server"]
