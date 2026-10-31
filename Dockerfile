# Backend de Academia (Express + TypeScript) para Fly.io.
# Sin disco persistente: el estado vive en MongoDB Atlas.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4100
CMD ["node", "dist/server.js"]
