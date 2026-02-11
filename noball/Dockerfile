FROM node:22-slim

WORKDIR /app

# Install root deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Install client deps and build
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npx vite build

# Copy server and shared
COPY server/ ./server/
COPY shared/ ./shared/
COPY data/.gitkeep ./data/

# Seed the database
RUN cd server && node seed.js

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/index.js"]
