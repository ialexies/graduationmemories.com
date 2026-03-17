# Deployment: gradmemories.lexserver.org

## Build (no Docker)

```bash
npm run build
```

Deploy the `dist/` folder to your server.

## SPA routing (required)

The app uses client-side routing. The server must serve `index.html` for all routes so React Router can handle them.

### Nginx

```nginx
location / {
    root /path/to/dist;
    try_files $uri $uri/ /index.html;
}
```

### Apache (.htaccess in dist/)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Subdomain

Configure DNS: point `gradmemories.lexserver.org` to your server.

## NFC URLs

Each NFC card stores a full URL, e.g. `https://gradmemories.lexserver.org/h322x`

## Docker deployment (home server)

Prereqs on the server:

- Docker (and optionally Docker Compose)
- Git or some way to copy this repo onto the server

### Build & run with Docker only

```bash
docker build -t graduationmemories .
docker run -d --name graduationmemories -p 8080:80 --restart unless-stopped graduationmemories
```

Then open `http://<server-ip>:8080` in your browser.

### Build & run with docker-compose

```bash
docker compose up -d --build
```

This will expose the app on port `8080` of the server.

