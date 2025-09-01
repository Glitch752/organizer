# Stage 1: Build client
FROM node:24 AS client-build
    WORKDIR /app/client
    COPY pnpm-workspace.yaml tsconfig.base.json ../
    COPY shared ../shared
    COPY client/package.json client/pnpm-lock.yaml ./

    RUN npm install -g pnpm && pnpm install && ls -l node_modules/vite && pnpm list vite
    COPY client .
    RUN pnpm run build
    # Client is now in /app/client/dist

# Stage 2: Build server
FROM node:24 AS server-build
    WORKDIR /app/server
    COPY server/package.json server/pnpm-lock.yaml ./
    COPY shared ../shared
    COPY pnpm-workspace.yaml tsconfig.base.json ../

    RUN npm install -g pnpm && pnpm install
    COPY server .
    RUN pnpm run build
    # Server is now in /app/server/dist
    COPY --from=client-build /app/client/dist /app/server/dist/static

# Final
FROM node:24-slim
    WORKDIR /app
    COPY --from=server-build /app/server/dist .
    ENV NODE_ENV=production
    EXPOSE 3000
    # Data is in /app/data, but we don't create an
    # anonymous volume here to allow flexibility
    CMD ["bash", "./start.sh"]
