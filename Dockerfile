# 生命之光 - 阿里云 Docker 部署
# 构建: docker build -t life-light .
# 运行: docker run -p 80:80 life-light
FROM nginx:1.25-alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY assets /usr/share/nginx/html/assets
COPY templates /usr/share/nginx/html/templates
