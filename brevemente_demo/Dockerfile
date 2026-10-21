# Etapa 1: Build de la aplicación React con Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente y compilar artefactos estáticos
COPY . .
RUN npm run build

# Etapa 2: Servidor web ligero con Nginx
FROM nginx:alpine

# Copiar los archivos compilados en la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
