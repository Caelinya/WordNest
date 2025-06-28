# Stage 1: Build Stage - Install dependencies and build the application
FROM node:20-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Install pnpm globally in the container
RUN npm install -g pnpm

# Copy root dependency manifest files from the build context (project root)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the web app's specific package.json to its correct location
# This is crucial for pnpm to understand the workspace structure
COPY apps/web/package.json ./apps/web/

# Install ONLY the web application's dependencies using pnpm's filtering
# This leverages caching and speeds up the build
RUN pnpm install --frozen-lockfile --filter web

# Copy the rest of the web application's source code
COPY apps/web ./apps/web

# Build the Next.js application
RUN pnpm --filter web build

# Stage 2: Production Stage - Create a lean image with only production artifacts
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment to production for Next.js
ENV NODE_ENV production

# Install pnpm to run the start command
RUN npm install -g pnpm

# From the 'builder' stage, copy only the necessary artifacts
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Install ONLY production dependencies for the web app
RUN pnpm install --prod --frozen-lockfile --filter web

# Expose the port Next.js runs on by default
EXPOSE 3000

# Change the final working directory to the app's folder
WORKDIR /app/apps/web

# The command to run the Next.js production server
CMD ["pnpm", "start"]