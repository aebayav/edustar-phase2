# EduStar Demo App

Single-page Node.js demo for the EduStar online education platform.

## Run locally

```powershell
$env:PORT=8080
node index.js
```

Open `http://localhost:8080`.

## Azure Blob video

The lesson player uses the Azure Blob Storage file below by default:

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

Existing API endpoints:

```text
GET /courses
GET /health
```
