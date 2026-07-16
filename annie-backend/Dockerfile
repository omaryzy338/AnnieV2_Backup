# ── Backend Annie (Node + Express) ───────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor cacheo de capas)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Carpeta de imágenes subidas (se monta como volumen en compose)
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]
