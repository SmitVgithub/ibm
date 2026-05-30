# Dockerfile for ibm
FROM alpine:latest
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["./start.sh"]