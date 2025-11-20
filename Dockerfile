FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm install -D typescript @types/node @types/express @types/cors
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "import('http').then(http => http.default.get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)))"

# Start server
CMD ["node", "dist/server.js"]
