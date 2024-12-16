# Use the official Node.js 18 image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json first (for better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
