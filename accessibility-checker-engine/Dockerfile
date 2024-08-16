# Use Node.js 20 (Latest LTS version as of now)
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
