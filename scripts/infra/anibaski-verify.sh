#!/bin/bash
# Haftalık yedek bütünlük kontrolü — her Pazar 04:00 UTC
# Crontab: 0 4 * * 0 /usr/local/bin/anibaski-verify.sh
# Kurulum: cp scripts/infra/anibaski-verify.sh /usr/local/bin/ && chmod +x /usr/local/bin/anibaski-verify.sh
LOG=/var/log/anibaski-backup.log
ERRORS=0

echo "" >> $LOG
echo "$(date '+%Y-%m-%d %H:%M:%S') === HAFTALIK VERİFY BAŞLADI ===" >> $LOG

# 1. R2 erişilebilir mi?
echo "1/3 R2 bağlantısı..." >> $LOG
rclone ls r2:anibaski-uploads/vps-yedek/ > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "    HATA: R2'ye erişilemiyor!" >> $LOG
  ERRORS=$((ERRORS+1))
else
  echo "    OK" >> $LOG
fi

# 2. Son yedek 25 saatten eski mi? (günlük cron kaçtıysa yakala)
echo "2/3 Son yedek tarihi..." >> $LOG
LATEST=$(rclone lsf r2:anibaski-uploads/vps-yedek/ --include "*.dlist.zip.aes" \
  --format=t 2>/dev/null | sort | tail -1 | awk '{print $1" "$2}')
if [ -z "$LATEST" ]; then
  echo "    HATA: R2'de yedek dosyasi bulunamadi!" >> $LOG
  ERRORS=$((ERRORS+1))
else
  LATEST_TS=$(date -d "$LATEST" +%s 2>/dev/null)
  NOW_TS=$(date +%s)
  AGE_HOURS=$(( (NOW_TS - LATEST_TS) / 3600 ))
  echo "    Son yedek: $LATEST - $AGE_HOURS saat once" >> $LOG
  if [ $AGE_HOURS -gt 25 ]; then
    echo "    UYARI: Son yedek 25 saatten eski!" >> $LOG
    ERRORS=$((ERRORS+1))
  else
    echo "    OK" >> $LOG
  fi
fi

# 3. Lokal backup volume erişilebilir mi?
echo "3/3 Lokal yedek..." >> $LOG
BACKUP_VOL=/var/lib/docker/volumes/tk97na2b6mh82vb1b12vkn02_duplicati-backups/_data/local-backup
FILE_COUNT=$(ls $BACKUP_VOL/*.aes 2>/dev/null | wc -l)
if [ $FILE_COUNT -eq 0 ]; then
  echo "    HATA: Lokal backup klasorunde dosya yok!" >> $LOG
  ERRORS=$((ERRORS+1))
else
  echo "    OK - $FILE_COUNT dosya mevcut" >> $LOG
fi

# Sonuç
if [ $ERRORS -eq 0 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') VERiFY BASARILI" >> $LOG
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') VERiFY BASARISIZ - $ERRORS hata" >> $LOG
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') === HAFTALIK VERiFY TAMAMLANDI ===" >> $LOG
