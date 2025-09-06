################ Development stage ################
# This Dockerfile creates a development environment that matches npm run dev
FROM --platform=linux/amd64 node:20-bullseye AS dev

# Install OpenSSL for certificate generation
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Generate SSL certificates if needed
RUN mkdir -p cert && \
    if [ ! -f cert/dev.crt ] || [ ! -f cert/dev.key ]; then \
        openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout cert/dev.key -out cert/dev.crt \
        -subj "/CN=dev.local" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"; \
    fi

# Expose both HTTP and HTTPS ports
EXPOSE 5173

# Run dev server
CMD ["npm", "run", "dev"]

################ Production build stage ################
FROM --platform=linux/amd64 node:20-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM deps AS build
WORKDIR /app
COPY . .
# Set environment variables for build
ENV VITE_KOALA_BASE_URL=/koala
# Override scripts.build to skip vue-tsc for production builds
RUN npm pkg set scripts.build="vite build"
RUN npm run build

################ Production serve stage ################
FROM --platform=linux/amd64 nginx:1.25-alpine AS production
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist .
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]