FROM node:20-alpine

WORKDIR /app

# Explicitly set NODE_ENV to development to ensure devDependencies (like vite) are installed
ENV NODE_ENV=development

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 5173

# Run Vite dev server
CMD ["npm", "run", "dev"]
