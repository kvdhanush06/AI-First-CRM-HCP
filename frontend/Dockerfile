# Stage 1: Build the React Application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY frontend/package.json ./

# Install npm dependencies
RUN npm install

# Copy application files
COPY frontend/ ./

# Build production distribution bundle
RUN npm run build

# Stage 2: Serve the build directory with Nginx
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
