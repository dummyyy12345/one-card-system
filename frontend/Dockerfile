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
CMD ["npm", "run", "start"]
