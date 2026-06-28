#!/bin/bash
# DB dump ve volume snapshot — anibaski-backup.sh tarafından çağrılır
# Kurulum: cp scripts/infra/pre-backup.sh /opt/backups/ && chmod +x /opt/backups/pre-backup.sh
set -e
STAGE=/var/lib/docker/volumes/tk97na2b6mh82vb1b12vkn02_duplicati-backups/_data/stage

echo '1/4 PostgreSQL dump...'
docker exec postgres-t14gsg9fc4mq54jiuaw6sndo pg_dumpall -U saasuser 2>/dev/null | gzip > $STAGE/postgres.sql.gz

echo '2/4 Coolify DB dump...'
docker exec coolify-db pg_dumpall -U postgres 2>/dev/null | gzip > $STAGE/coolify-db.sql.gz || true

echo '3/4 Coolify config...'
tar czf $STAGE/coolify-config.tar.gz /data/coolify/ 2>/dev/null || true

echo '4/4 n8n volume...'
docker run --rm \
  -v t14gsg9fc4mq54jiuaw6sndo_n8n-data:/data \
  -v $STAGE:/backup \
  alpine tar czf /backup/n8n-data.tar.gz /data 2>/dev/null

chmod 644 $STAGE/*.gz 2>/dev/null || true
echo 'PRE-BACKUP OK'
