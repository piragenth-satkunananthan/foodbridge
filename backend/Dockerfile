# Production Dockerfile for FoodBridge Backend API
FROM node:20-alpine AS runner

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose API port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start production API server
CMD ["node", "server.js"]
