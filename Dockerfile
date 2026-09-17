FROM node:22-bookworm

# Install FFmpeg
RUN apt-get update \
    && apt-get install -y ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set application directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Create required folders
RUN mkdir -p uploads compressed

# Render provides the PORT environment variable
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]