FROM golang:1.26.10-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go test ./...
RUN CGO_ENABLED=0 go build -o /out/server . && CGO_ENABLED=0 go build -o /out/migrate ./migrate

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/server /out/migrate ./
EXPOSE 8888
CMD ["/bin/sh", "-c", "./migrate && exec ./server"]
