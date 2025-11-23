# Build stage
FROM rust:1.83-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    musl-dev \
    openssl-dev \
    pkgconfig

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy main.rs to cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy source code
COPY src ./src

# Build actual application
RUN touch src/main.rs && \
    cargo build --release

# Runtime stage
FROM alpine:latest

RUN apk add --no-cache \
    ca-certificates \
    libgcc

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/linda-backend /app/linda-backend

# Set environment variables
ENV PORT=3000
ENV RUST_LOG=info

EXPOSE 3000

CMD ["/app/linda-backend"]
