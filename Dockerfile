FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
RUN npm install -g serve
CMD ["serve", "-s", ".", "-l", "3000"]