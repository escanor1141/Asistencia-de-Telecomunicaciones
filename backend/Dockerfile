FROM node:20-alpine

WORKDIR /app

# Archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Copiar resto del código
COPY . .

# Generar cliente prisma
RUN npx prisma generate

# Construir Next.js
RUN npm run build

# Puerto para Next.js
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]
