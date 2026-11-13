# OmniFlow — Production Backup & Disaster Recovery Runbook (`BACKUP_RECOVERY.md`)

This runbook defines the disaster recovery policy, automated backup schedules, and step-by-step restoration procedures for **OmniFlow SaaS**.

---

## 1. Disaster Recovery Objectives

- **Recovery Point Objective (RPO)**: **< 1 hour** (Maximum permissible data loss in disaster scenario).
- **Recovery Time Objective (RTO)**: **< 30 minutes** (Maximum time to restore full platform availability).
- **Retention Schedule**:
  - Hourly snapshots: Retained for 48 hours.
  - Daily backups: Retained for 30 days.
  - Weekly archives: Retained for 12 months.
  - Offsite storage: All backups mirrored to geographically isolated S3 cold storage.

---

## 2. Automated MySQL Database Backup Script

Create the backup script on your host at `/opt/omniflow/scripts/backup-db.sh`:

```bash
#!/bin/bash
# ==============================================================================
# OmniFlow SaaS — Automated Database Backup Script
# ==============================================================================
set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/omniflow/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="omniflow_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="omniflow_prod_mysql"
DB_NAME="omniflow_prod_db"
DB_USER="root"
# Load DB_ROOT_PASSWORD from /opt/omniflow/.env
source /opt/omniflow/.env

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting database backup for $DB_NAME..."

# Execute consistent mysqldump with single transaction to avoid locking tables
docker exec "$CONTAINER_NAME" mysqldump \
  -u"$DB_USER" \
  -p"$DB_ROOT_PASSWORD" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --databases "$DB_NAME" | gzip -9 > "${BACKUP_DIR}/${FILENAME}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$TIMESTAMP] Backup successfully created: ${FILENAME} (${BACKUP_SIZE})"

# Upload to offsite S3 cold storage bucket
if command -v aws &> /dev/null; then
  echo "Uploading backup to offsite S3 vault..."
  aws s3 cp "${BACKUP_DIR}/${FILENAME}" "s3://omniflow-offsite-backups/mysql/${FILENAME}" --storage-class GLACIER_IR
fi

# Rotate backups older than 30 days locally
find "$BACKUP_DIR" -type f -name "omniflow_backup_*.sql.gz" -mtime +30 -delete
echo "Local backup rotation complete."
```

Make executable and schedule in cron:
```bash
chmod +x /opt/omniflow/scripts/backup-db.sh

# Open crontab
crontab -e

# Run every 6 hours (00:00, 06:00, 12:00, 18:00)
0 */6 * * * /opt/omniflow/scripts/backup-db.sh >> /var/log/omniflow_backup.log 2>&1
```

---

## 3. Redis Snapshot & Persistence Verification

OmniFlow configures Redis with **AOF (Append Only File)** enabled (`--appendonly yes`) for continuous durable persistence.

To trigger an instant background snapshot (RDB):
```bash
docker exec -it omniflow_prod_redis redis-cli -a "$REDIS_PASSWORD" BGSAVE
```
The snapshot will be saved in `/data/dump.rdb` within the `redis_prod_data` persistent volume.

---

## 4. Object Storage (MinIO / S3) Synchronization

All customer documents, RAG knowledge files, and media attachments stored in MinIO must be mirrored to offsite cloud storage daily:

```bash
#!/bin/bash
# Mirror local MinIO data to secondary S3 bucket
docker run --rm --network omniflow_backend_net \
  -v minio_prod_data:/data:ro \
  amazon/aws-cli:latest \
  s3 sync /data s3://omniflow-offsite-backups/media/ --delete
```

---

## 5. Point-in-Time Database Restoration Procedure

Follow these steps during a recovery drill or post-incident restoration:

### Step 1: Stop Incoming Traffic
To prevent data inconsistency during restoration, put Nginx into maintenance mode or stop the API & Worker:
```bash
docker compose -f docker-compose.prod.yml stop api worker
```

### Step 2: Identify Latest Valid Backup Archive
```bash
ls -lh /var/backups/omniflow/mysql/
# Or download from S3 if server was destroyed:
# aws s3 cp s3://omniflow-offsite-backups/mysql/<LATEST_FILE>.sql.gz .
```

### Step 3: Restore Database Dump
```bash
# Decompress and stream dump directly into MySQL container
gunzip < /var/backups/omniflow/mysql/omniflow_backup_20261031_180000.sql.gz | \
  docker exec -i omniflow_prod_mysql mysql -u root -p"$DB_ROOT_PASSWORD"
```

### Step 4: Verify Database Consistency
Execute basic verification queries:
```bash
docker exec -it omniflow_prod_mysql mysql -u omniflow_prod_user -p"$DB_PASSWORD" -e "
  USE omniflow_prod_db;
  SELECT 'Tenants' as Entity, COUNT(*) as Count FROM Tenant
  UNION ALL
  SELECT 'Users', COUNT(*) FROM User
  UNION ALL
  SELECT 'Orders', COUNT(*) FROM Order
  UNION ALL
  SELECT 'Conversations', COUNT(*) FROM Conversation;
"
```

### Step 5: Restart Application Services & Reconnect
```bash
docker compose -f docker-compose.prod.yml start api worker

# Verify API and database connectivity
curl -s http://localhost:4000/api/v1/health | jq .
```

---

## 6. Disaster Recovery Verification Checklist

- [ ] Verify database dump runs automatically via cron without errors.
- [ ] Verify gzip compression ratio (> 80% compression on text data).
- [ ] Verify offsite S3 replication credentials are valid.
- [ ] Perform quarterly test restoration on a staging cluster.
- [ ] Verify foreign keys, indices, and constraints remain intact after restoration.
