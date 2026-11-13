FROM golang:1.25.6-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /pokerlearn-api .

FROM alpine:3.22
RUN addgroup -S app && adduser -S -G app app
COPY --from=build /pokerlearn-api /usr/local/bin/pokerlearn-api
USER app
EXPOSE 8080
CMD ["pokerlearn-api"]
