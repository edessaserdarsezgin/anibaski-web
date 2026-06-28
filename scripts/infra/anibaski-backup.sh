#!/bin/bash
# AnıBaskı VPS otomatik yedekleme - gece 03:00 UTC çalışır
# Crontab: 0 3 * * * /usr/local/bin/anibaski-backup.sh
# Kurulum: cp scripts/infra/anibaski-backup.sh /usr/local/bin/ && chmod +x /usr/local/bin/anibaski-backup.sh
set -e
STAGE=/opt/backups/stage
BACKUP_VOL=/var/lib/docker/volumes/tk97na2b6mh82vb1b12vkn02_duplicati-backups/_data
LOG=/var/log/anibaski-backup.log

echo "$(date '+%Y-%m-%d %H:%M:%S') === YEDEK BAŞLADI ===" >> $LOG

# 1. DB ve volume'ları stage'e yaz
/opt/backups/pre-backup.sh >> $LOG 2>&1

# 2. Duplicati: stage → lokal şifreli yedek
docker exec -u abc duplicati-tk97na2b6mh82vb1b12vkn02 \
  /app/duplicati/duplicati-server-util run 'AniBaski VPS Yedekleme' --wait >> $LOG 2>&1 || true

# 3. Rclone: lokal şifreli → R2
rclone sync $BACKUP_VOL/local-backup/ r2:anibaski-uploads/vps-yedek/ \
  --size-only --no-update-modtime >> $LOG 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') === YEDEK TAMAMLANDI ===" >> $LOG

# 4. Eski stage dosyalarını temizle (7 günden eski)
find /opt/backups/stage -mtime +7 -delete 2>/dev/null || true
