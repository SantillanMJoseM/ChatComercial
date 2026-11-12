# Backup y recuperación

## Backup lógico PostgreSQL
docker exec cap-postgres pg_dump -U cap -d cap -Fc > /backup/cap-$(date +%Y%m%d).dump

## Backup de configuración
cp /opt/plataforma-atencion-comercial/.env /backup/.env
cp /opt/plataforma-atencion-comercial/docker-compose.yml /backup/

## Volúmenes
- cap_pg_data (PostgreSQL)
- cap_redis_data (Redis)
- cap_knowledge_storage (documentos)
- cap_cw_pg_data (Chatwoot DB)

## Restauración
docker exec -i cap-postgres pg_restore -U cap -d cap < /backup/cap.dump

## Rotación
Mantener últimos 7 backups diarios + 4 semanales. Almacenar fuera del volumen principal.
