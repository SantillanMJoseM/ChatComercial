# HTTPS y exposición segura (recomendado)

## Requisitos
- Dominio propio apuntando al servidor.
- Reverse proxy (nginx o Traefik) con TLS (Let's Encrypt).
- Firewall: exponer solo 80/443 al proxy; backend/DB/Redis internos.

## Configuración sugerida (nginx)
server {
  listen 443 ssl;
  server_name app.example.com;
  ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
  location / {
    proxy_pass http://cap-web:3010;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location /api/ {
    proxy_pass http://cap-api:4000;
  }
}

## Headers de seguridad
- Strict-Transport-Security
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

## Notas
- No modificar firewall ni DNS en esta fase.
- CORS_ORIGIN debe actualizarse al dominio HTTPS.
- BETTER_AUTH_URL debe apuntar al dominio HTTPS.
