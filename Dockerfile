# Use Bun's official Docker image
FROM oven/bun:latest

# Set working directory inside the container
WORKDIR /app

# Copy everything into the container
COPY . .

# Install dependencies using Bun
RUN bun install

# Expose the port your app runs on (adjust if needed)
EXPOSE 3000

# Start the Bun app
CMD ["bun", "run", "index.ts"]
 
