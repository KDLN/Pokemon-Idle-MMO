FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (need dev deps for build)
RUN echo "Installing dependencies..." && npm ci && echo "Dependencies installed"

# Copy source code
COPY . .

# Build TypeScript
RUN echo "Building TypeScript..." && npm run build && echo "Build complete"

# Remove dev dependencies
RUN npm prune --production

EXPOSE 8080

CMD ["node", "dist/index.js"]
