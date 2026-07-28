# tesla-http-proxy has no official Docker image, and `go install ...@latest`
# doesn't work for it (its go.mod has replace directives that only resolve
# from inside the module) — build from a clone instead, same as the local
# dev setup documented in backend/keys/README.md.
FROM golang:1.22-bookworm AS build
WORKDIR /src
RUN git clone https://github.com/teslamotors/vehicle-command.git . \
    && go build -o /tesla-http-proxy ./cmd/tesla-http-proxy

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /tesla-http-proxy /usr/local/bin/tesla-http-proxy

ENTRYPOINT ["tesla-http-proxy"]
