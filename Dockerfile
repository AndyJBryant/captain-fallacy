FROM node:20-alpine AS builder

WORKDIR /app

# Install frontend deps and build
COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Install server deps and build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm install
RUN npm run build

# Runtime image
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy server build
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy frontend build (served by Hono)
COPY --from=builder /app/dist ./dist

# Copy data files (fallacies + aliases)
COPY --from=builder /app/data ./data

EXPOSE 3000

CMD ["node", "server/dist/index.js"]
