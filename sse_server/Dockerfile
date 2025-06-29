# Stage 1: Build the Go application
FROM golang:1.25rc1-alpine3.22 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum files to leverage Docker's caching
# If these files don't change, this layer will be cached, speeding up builds
COPY go.mod go.sum ./

# Download all Go modules. This step is also cacheable.
RUN go mod tidy

# Copy the rest of your application's source code
COPY . .

# Build the Go application
# -o app: Specifies the output executable name as 'app'
# -ldflags "-s -w": Reduces the size of the executable by removing symbol and debug info
# CGO_ENABLED=0: Disables CGO, making the executable statically linked and independent of glibc,
#                which is crucial for using scratch or alpine base images in the final stage.
RUN CGO_ENABLED=0 go build -o app -ldflags "-s -w" ./main.go

# Stage 2: Create the final lean image
# Use a minimal base image. 'scratch' is the absolute smallest, containing nothing.
# 'alpine' is also a good choice if you need basic shell utilities or certificates.
FROM alpine:3.20 AS final

# If your application makes HTTPS requests, you might need CA certificates.
# Alpine's minimal nature means they are not included by default in scratch.
# If using 'scratch', you'd typically copy them from an alpine image:
# COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# For alpine, ca-certificates are usually available or easily installable if needed
# RUN apk add --no-cache ca-certificates # Uncomment if you're sure you need them explicitly

# Set the working directory
WORKDIR /app

# Copy the built executable from the builder stage
COPY --from=builder /app/app .

# Expose the port your application listens on
# This is for documentation and doesn't actually publish the port
EXPOSE 8000

# Define the command to run your application when the container starts
CMD ["./app"]