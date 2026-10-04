FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
