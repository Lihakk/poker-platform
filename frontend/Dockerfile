FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
ARG CADDY_CONFIG=Caddyfile
COPY --from=build /src/dist /srv
COPY ${CADDY_CONFIG} /etc/caddy/Caddyfile
EXPOSE 80 443
