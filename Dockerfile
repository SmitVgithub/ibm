# Stage 1: Build & Test
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm test || true

# Stage 2: Serve static files
FROM nginx:alpine AS production

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=builder /app/index.html ./
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/fonts ./fonts
COPY --from=builder /app/js ./js
COPY --from=builder /app/styles ./styles
COPY --from=builder /app/.htaccess ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
