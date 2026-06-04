# EduStar Placeholder Demo App

Single-page Node.js placeholder for the CMPE433 scenario 5 online education platform migration PoC.

The page avoids exam-specific course content and focuses on the required Azure proof points:

- IaaS workload running on an Azure VM
- PaaS workload represented by Azure Database for PostgreSQL
- VNet split into public and private subnets
- Azure Blob Storage holding real media data
- Azure Monitor, Log Analytics, and alerting
- Terraform-managed infrastructure

## Run locally

```powershell
$env:PORT=8080
node index.js
```

Open `http://localhost:8080`.

## Azure Blob media

The media placeholder uses the Azure Blob Storage file below by default:

```text
https://edustarstorage.blob.core.windows.net/videos/Test%20Video.mp4
```

Because the `videos` container is private, run the app with a SAS-enabled URL:

```powershell
$env:PORT=8080
$env:EDUSTAR_VIDEO_URL="https://edustarstorage.blob.core.windows.net/videos/Test%20Video.mp4?<sas-token>"
node index.js
```

Alternatively, keep the account/container/blob defaults and pass only the SAS token:

```powershell
$env:PORT=8080
$env:AZURE_STORAGE_SAS_TOKEN="<sas-token-without-leading-question-mark>"
node index.js
```

API endpoints:

```text
GET /health
GET /workloads
GET /courses
```
