# ── Frontend Annie (React CRA) ───────────────────────────────────
# Etapa 1: build de la app
FROM node:20-alpine AS build

WORKDIR /app

# La URL del backend se hornea en tiempo de build (CRA usa REACT_APP_*)
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: servir el build estático con nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
