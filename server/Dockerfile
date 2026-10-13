FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies first so this layer is cached between code changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY scripts ./scripts

USER node
EXPOSE 4000
# On boot the server syncs indexes and seeds products if the collection is empty.
CMD ["node", "src/index.js"]
