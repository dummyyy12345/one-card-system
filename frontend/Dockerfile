FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY . .
ARG NEXT_PUBLIC_API_SERVER_URL=http://localhost:8888
ENV NEXT_PUBLIC_API_SERVER_URL=$NEXT_PUBLIC_API_SERVER_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
CMD ["npm", "run", "start"]
