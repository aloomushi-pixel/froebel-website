FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to cache npm install
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all website files, including server.js
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the Node.js server
CMD ["node", "server.js"]
