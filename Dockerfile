############### build stage ###############
FROM --platform=linux/amd64 node:20-bullseye-slim AS build
WORKDIR /app

# 只複製相依檔
COPY package*.json ./

# 安裝依賴（已無 tailwind）
RUN npm ci --legacy-peer-deps

# 複製原始碼並編譯
COPY . .
RUN npm run build


############### serve stage ###############
FROM --platform=linux/amd64 nginx:1.25-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
