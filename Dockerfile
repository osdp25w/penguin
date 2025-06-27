################ deps stage ################
FROM --platform=linux/amd64 node:20-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

################ build stage ###############
FROM deps AS build
WORKDIR /app
COPY . .

# 覆寫 scripts.build -> 只跑 vite build
RUN npm pkg set scripts.build="vite build"

RUN npm run build

################ serve stage ###############
FROM --platform=linux/amd64 nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist .
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
