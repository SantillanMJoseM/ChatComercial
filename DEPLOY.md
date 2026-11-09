# Despliegue de ChatComercial

## Requisitos del servidor
- Debian 13
- Docker Engine
- Docker Compose
- Git
- curl

## Instalación inicial
```bash
sudo mkdir -p /opt/chatcomercial
sudo chown $USER:$USER /opt/chatcomercial
cd /opt/chatcomercial
git clone https://github.com/SantillanMJoseM/ChatComercial.git .
./deploy.sh
```

## Actualización de versión
```bash
cd /opt/chatcomercial
./deploy.sh
```

## Rollback
Si el despliegue falla, el script intenta volver a la imagen anterior (`chatcomercial:previous`).
Manual:
```bash
docker tag chatcomercial:previous chatcomercial:latest
docker compose up -d
```

## Puertos
- Externo: 3001
- Interno: 80

## Healthcheck
`http://servidor:3001/health`