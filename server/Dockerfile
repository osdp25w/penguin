FROM node:18-alpine

WORKDIR /app

# Install only production deps (no lockfile in this folder)
COPY package*.json ./
RUN npm install --omit=dev

COPY index.js ./

EXPOSE 3001

CMD ["node", "index.js"]
