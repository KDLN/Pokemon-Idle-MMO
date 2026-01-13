FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (need dev deps for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 8080

CMD ["node", "dist/index.js"]
