# Stage 1: Build the React app
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Bake the API URL into the build so it connects to the mock-api container
ENV VITE_API_BASE=http://mock-api:8001
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000

# Reconfigure Nginx to run on port 3000 and support React Router
RUN sed -i 's/listen  *80;/listen 3000;/g' /etc/nginx/conf.d/default.conf
RUN sed -i '/location \/ {/a \        try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]