# 阿里云 Nginx 部署指南

## 方式一：直接使用 Nginx（ECS）

1. 在 ECS 上安装 Nginx
2. 将项目文件上传到服务器，例如 `/var/www/life_light/`
3. 复制 `nginx/nginx.conf` 到 `/etc/nginx/nginx.conf`，或创建 site 配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/life_light;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

4. 修改 `js/config.js` 中的 Supabase 配置（或通过构建时注入）
5. 配置 HTTPS（推荐 Let's Encrypt + certbot）

## 方式二：Docker 部署

```bash
docker build -t life-light .
docker run -d -p 80:80 life-light
```

## 方式三：阿里云 SAE

参考阿里云文档，使用 Docker 镜像部署到 SAE，绑定 CLB 获取公网访问。

## 注意事项

- 前端直接请求 Supabase API，无需 Nginx 反向代理
- 确保 Supabase 项目已配置 CORS 允许你的域名
- 生产环境建议配置 CDN 加速静态资源
