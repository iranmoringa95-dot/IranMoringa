# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /build

# Copy dependency definitions
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download

# Copy backend source code
COPY apps/api ./

# Build statically compiled binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/bin/moringalab-api ./cmd/api

# Run stage
FROM alpine:3.19

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Tehran

COPY --from=builder /build/bin/moringalab-api /app/moringalab-api

EXPOSE 8080
ENV APP_PORT=8080
ENV APP_ENV=production

CMD ["/app/moringalab-api"]
