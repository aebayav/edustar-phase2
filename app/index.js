const fs = require('fs');
const http = require('http');
const path = require('path');

const workloads = [
  {
    id: 1,
    name: 'Learning web shell',
    model: 'IaaS',
    service: 'Azure VM',
    status: 'Running',
    detail: 'Node.js placeholder app served from the public subnet'
  },
  {
    id: 2,
    name: 'Application database',
    model: 'PaaS',
    service: 'Azure Database for PostgreSQL',
    status: 'Provisioned',
    detail: 'Managed PostgreSQL target for users, enrollments, and progress events'
  },
  {
    id: 3,
    name: 'Protected video library',
    model: 'Storage',
    service: 'Azure Blob Storage',
    status: 'Private',
    detail: 'Lesson media stored as real blob data with SAS-based demo playback'
  },
  {
    id: 4,
    name: 'Learner analytics',
    model: 'PaaS ready',
    service: 'PostgreSQL + dashboards',
    status: 'Placeholder',
    detail: 'Tracks watched lessons, weak topics, and drop-off points for future BI'
  },
  {
    id: 5,
    name: 'Operations monitoring',
    model: 'Platform',
    service: 'Azure Monitor',
    status: 'Enabled',
    detail: 'VM metrics, Log Analytics, and alert rules are represented in Terraform'
  }
];

const proofPoints = [
  { label: 'IaaS workload', value: 'Azure VM', detail: 'Runs this Node.js site' },
  { label: 'PaaS workload', value: 'PostgreSQL', detail: 'Managed database target' },
  { label: 'Network', value: '2 subnets', detail: 'Public app and private data tiers' },
  { label: 'Storage', value: 'Blob data', detail: 'Private video object playback' },
  { label: 'Monitoring', value: 'On', detail: 'Metrics, logs, and alerts' },
  { label: 'IaC', value: 'Terraform', detail: 'Infrastructure deployed as code' }
];

const scenarioNotes = [
  'Turkish edtech startup with live and recorded course delivery',
  '50,000 registered learners and 200 instructors represented as planning scale',
  'Video storage cost pressure moved from block storage toward blob storage',
  'Student data, including minors, treated as KVKK-sensitive information',
  'Video content protected as primary intellectual property',
  'Expansion readiness for Azerbaijan and Turkic republic markets'
];

const architecture = [
  { title: 'Public subnet', detail: 'Cloudflare edge routes traffic to the Azure VM demo host.' },
  { title: 'Private subnet', detail: 'Database placement is isolated from direct public access.' },
  { title: 'Blob storage', detail: 'Course media is separated from compute and served through controlled URLs.' },
  { title: 'Monitor plane', detail: 'Log Analytics, metric alerts, and availability checks support operations.' }
];

const videoConfig = {
  account: process.env.AZURE_STORAGE_ACCOUNT || 'edustarstorage',
  container: process.env.AZURE_STORAGE_CONTAINER || 'videos',
  blob: process.env.AZURE_STORAGE_BLOB || 'Test Video.mp4',
  sasTokenFile: process.env.AZURE_STORAGE_SAS_TOKEN_FILE || '/etc/edustar-demo-sas-token'
};

const port = Number(process.env.PORT || 80);
const assetDir = path.join(__dirname, 'assets');

function encodeBlobPath(blobName) {
  return blobName.split('/').map(encodeURIComponent).join('/');
}

function buildBlobVideoUrl() {
  if (process.env.EDUSTAR_VIDEO_URL) {
    return process.env.EDUSTAR_VIDEO_URL;
  }

  const baseUrl = `https://${videoConfig.account}.blob.core.windows.net/${videoConfig.container}/${encodeBlobPath(videoConfig.blob)}`;
  const sasToken = readSasToken().replace(/^\?/, '');
  return sasToken ? `${baseUrl}?${sasToken}` : baseUrl;
}

function readSasToken() {
  if (process.env.AZURE_STORAGE_SAS_TOKEN) {
    return process.env.AZURE_STORAGE_SAS_TOKEN.trim();
  }

  if (!videoConfig.sasTokenFile) {
    return '';
  }

  try {
    return fs.readFileSync(videoConfig.sasTokenFile, 'utf8').trim();
  } catch (error) {
    return '';
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(html);
}

function serveAsset(res, pathname) {
  const fileName = path.basename(pathname);
  const allowedAssets = {
    'edustar-demo.png': 'image/png'
  };

  if (!allowedAssets[fileName]) {
    sendJson(res, 404, { error: 'Asset not found' });
    return;
  }

  const filePath = path.join(assetDir, fileName);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { error: 'Asset not found' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': allowedAssets[fileName],
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(data);
  });
}

function renderProofPoints() {
  return proofPoints.map((item) => `
    <article class="proof-card">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </article>
  `).join('');
}

function renderWorkloads() {
  return workloads.map((workload) => `
    <article class="workload-row">
      <div>
        <span class="tag">${escapeHtml(workload.model)}</span>
        <h3>${escapeHtml(workload.name)}</h3>
        <p>${escapeHtml(workload.detail)}</p>
      </div>
      <div class="service">
        <strong>${escapeHtml(workload.service)}</strong>
        <span>${escapeHtml(workload.status)}</span>
      </div>
    </article>
  `).join('');
}

function renderScenarioNotes() {
  return scenarioNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
}

function renderArchitecture() {
  return architecture.map((item) => `
    <article class="arch-step">
      <span></span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.detail)}</p>
    </article>
  `).join('');
}

function renderHomePage() {
  const videoSourceLabel = `${videoConfig.account}/${videoConfig.container}/${videoConfig.blob}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EduStar Placeholder</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172026;
      --muted: #5d6875;
      --line: #dbe3ea;
      --panel: #ffffff;
      --soft: #f4f8f7;
      --teal: #0e9384;
      --blue: #2d63c8;
      --amber: #d99513;
      --red: #c85048;
      --shadow: 0 18px 48px rgba(26, 43, 54, 0.14);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #f7faf9;
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }

    .page {
      min-height: 100vh;
    }

    .topbar {
      align-items: center;
      background: rgba(255, 255, 255, 0.92);
      border-bottom: 1px solid var(--line);
      display: flex;
      gap: 24px;
      justify-content: space-between;
      padding: 16px clamp(20px, 5vw, 72px);
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(18px);
    }

    .brand {
      align-items: center;
      display: inline-flex;
      gap: 10px;
      font-weight: 800;
      min-width: 150px;
    }

    .brand-mark {
      align-items: center;
      background: var(--ink);
      border-radius: 8px;
      color: white;
      display: inline-flex;
      height: 34px;
      justify-content: center;
      width: 34px;
    }

    .nav {
      color: var(--muted);
      display: flex;
      flex-wrap: wrap;
      font-size: 0.92rem;
      gap: 18px;
      justify-content: center;
    }

    .nav a {
      color: inherit;
      text-decoration: none;
    }

    .status-pill {
      align-items: center;
      border: 1px solid rgba(14, 147, 132, 0.25);
      border-radius: 999px;
      color: var(--teal);
      display: inline-flex;
      font-size: 0.86rem;
      font-weight: 800;
      gap: 8px;
      padding: 8px 12px;
      white-space: nowrap;
    }

    .status-pill::before {
      background: var(--teal);
      border-radius: 50%;
      content: "";
      height: 8px;
      width: 8px;
    }

    main {
      overflow: hidden;
    }

    section {
      padding: clamp(44px, 7vw, 88px) clamp(20px, 5vw, 72px);
    }

    .hero {
      align-items: center;
      display: grid;
      gap: clamp(28px, 5vw, 56px);
      grid-template-columns: minmax(0, 0.92fr) minmax(320px, 1.08fr);
      min-height: calc(100vh - 67px);
      padding-bottom: 40px;
    }

    .eyebrow {
      color: var(--teal);
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }

    h1,
    h2,
    h3,
    p {
      margin-top: 0;
    }

    h1 {
      font-size: clamp(2.55rem, 5.8vw, 5.45rem);
      line-height: 0.96;
      margin-bottom: 22px;
      max-width: 820px;
    }

    h2 {
      font-size: clamp(1.9rem, 3.5vw, 3.35rem);
      line-height: 1.03;
      margin-bottom: 14px;
    }

    h3 {
      font-size: 1.05rem;
      margin-bottom: 8px;
    }

    .lead {
      color: var(--muted);
      font-size: clamp(1.02rem, 1.7vw, 1.24rem);
      line-height: 1.65;
      max-width: 680px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 28px;
    }

    .button {
      align-items: center;
      border-radius: 8px;
      display: inline-flex;
      font-weight: 800;
      gap: 10px;
      min-height: 44px;
      padding: 12px 16px;
      text-decoration: none;
    }

    .button.primary {
      background: var(--ink);
      color: #fff;
    }

    .button.secondary {
      background: #fff;
      border: 1px solid var(--line);
      color: var(--ink);
    }

    .media-stage {
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      overflow: hidden;
      position: relative;
    }

    .media-stage img {
      display: block;
      height: 100%;
      object-fit: cover;
      width: 100%;
    }

    .media-caption {
      align-items: center;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid var(--line);
      border-radius: 8px;
      bottom: 18px;
      display: grid;
      gap: 2px;
      left: 18px;
      padding: 12px 14px;
      position: absolute;
    }

    .media-caption strong {
      font-size: 0.96rem;
    }

    .media-caption span {
      color: var(--muted);
      font-size: 0.82rem;
    }

    .proof-grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      padding-top: 0;
    }

    .proof-card,
    .panel,
    .workload-row,
    .arch-step {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }

    .proof-card {
      display: grid;
      gap: 7px;
      min-height: 132px;
      padding: 18px;
    }

    .proof-card span,
    .proof-card small,
    .service span,
    .source-label {
      color: var(--muted);
      font-size: 0.85rem;
    }

    .proof-card strong {
      font-size: 1.35rem;
    }

    .split {
      display: grid;
      gap: 28px;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 0.72fr);
    }

    .section-head {
      margin-bottom: 28px;
      max-width: 780px;
    }

    .workload-list {
      display: grid;
      gap: 12px;
    }

    .workload-row {
      align-items: center;
      display: grid;
      gap: 18px;
      grid-template-columns: minmax(0, 1fr) minmax(170px, 0.28fr);
      padding: 18px;
    }

    .workload-row p,
    .arch-step p,
    .panel p {
      color: var(--muted);
      line-height: 1.55;
      margin-bottom: 0;
    }

    .tag {
      background: #e8f5f3;
      border-radius: 999px;
      color: var(--teal);
      display: inline-flex;
      font-size: 0.74rem;
      font-weight: 900;
      margin-bottom: 9px;
      padding: 5px 8px;
      text-transform: uppercase;
    }

    .service {
      display: grid;
      gap: 6px;
      justify-items: end;
      text-align: right;
    }

    .panel {
      padding: 24px;
    }

    .panel ul {
      display: grid;
      gap: 12px;
      list-style: none;
      margin: 20px 0 0;
      padding: 0;
    }

    .panel li {
      border-left: 3px solid var(--blue);
      color: var(--muted);
      line-height: 1.45;
      padding-left: 12px;
    }

    .video-panel video {
      background: #0f1720;
      border-radius: 8px;
      display: block;
      margin-top: 18px;
      width: 100%;
    }

    .source-label {
      display: block;
      margin-top: 10px;
      overflow-wrap: anywhere;
    }

    .arch-grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .arch-step {
      min-height: 190px;
      padding: 20px;
    }

    .arch-step span {
      background: linear-gradient(135deg, var(--teal), var(--blue));
      border-radius: 8px;
      display: block;
      height: 12px;
      margin-bottom: 22px;
      width: 54px;
    }

    .footer {
      border-top: 1px solid var(--line);
      color: var(--muted);
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
      padding: 24px clamp(20px, 5vw, 72px);
    }

    @media (max-width: 1080px) {
      .hero,
      .split {
        grid-template-columns: 1fr;
      }

      .proof-grid,
      .arch-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 680px) {
      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }

      .nav {
        justify-content: flex-start;
      }

      .hero {
        min-height: auto;
      }

      .proof-grid,
      .arch-grid {
        grid-template-columns: 1fr;
      }

      .workload-row {
        grid-template-columns: 1fr;
      }

      .service {
        justify-items: start;
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="topbar">
      <div class="brand" aria-label="EduStar">
        <span class="brand-mark">E</span>
        <span>EduStar</span>
      </div>
      <nav class="nav" aria-label="Primary">
        <a href="#proof">Proof</a>
        <a href="#workloads">Workloads</a>
        <a href="#media">Media</a>
        <a href="#architecture">Architecture</a>
      </nav>
      <span class="status-pill">Azure PoC online</span>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div>
          <span class="eyebrow">CMPE433 Scenario 5 Placeholder</span>
          <h1 id="hero-title">Online education cloud migration PoC</h1>
          <p class="lead">A neutral placeholder for the edtech migration demo: VM-hosted application shell, managed database target, private media storage, monitoring, and Terraform-backed Azure infrastructure.</p>
          <div class="actions">
            <a class="button primary" href="#workloads">Review workloads</a>
            <a class="button secondary" href="/health">Open health JSON</a>
          </div>
        </div>
        <div class="media-stage" aria-label="EduStar placeholder preview">
          <img src="/assets/edustar-demo.png" alt="Placeholder learning dashboard on a tablet">
          <div class="media-caption">
            <strong>Phase 2 demo shell</strong>
            <span>No exam-specific course content</span>
          </div>
        </div>
      </section>

      <section class="proof-grid" id="proof" aria-label="Project requirement proof points">
        ${renderProofPoints()}
      </section>

      <section class="split" id="workloads">
        <div>
          <div class="section-head">
            <span class="eyebrow">Scenario fit</span>
            <h2>Workloads mapped to the cloud target</h2>
            <p class="lead">The page intentionally stays as a placeholder while proving the required cloud components are present and aligned with the online education scenario.</p>
          </div>
          <div class="workload-list">
            ${renderWorkloads()}
          </div>
        </div>
        <aside class="panel">
          <span class="eyebrow">Scenario 5 notes</span>
          <h2>What this PoC represents</h2>
          <ul>
            ${renderScenarioNotes()}
          </ul>
        </aside>
      </section>

      <section class="split" id="media">
        <div class="panel video-panel">
          <span class="eyebrow">Storage proof</span>
          <h2>Private blob media placeholder</h2>
          <p>The player requests a real Azure Blob object through the local Node proxy. In production this pattern would be replaced by short-lived signed URLs and stronger content controls.</p>
          <video controls preload="metadata" poster="/assets/edustar-demo.png">
            <source src="/media/demo-video" type="video/mp4">
          </video>
          <span class="source-label">Blob source: ${escapeHtml(videoSourceLabel)}</span>
        </div>
        <div class="panel">
          <span class="eyebrow">Security posture</span>
          <h2>KVKK and content protection placeholders</h2>
          <p>Student records, under-18 learner data, instructor content, and video IP are shown as first-class migration concerns. The demo keeps content generic while the Azure design separates app, data, and media responsibilities.</p>
        </div>
      </section>

      <section id="architecture">
        <div class="section-head">
          <span class="eyebrow">Azure layout</span>
          <h2>Minimum architecture required by the project</h2>
          <p class="lead">The Terraform stack covers the network, VM, managed database, storage, Key Vault, Bastion, dashboard, Log Analytics, and alerting resources used by this placeholder.</p>
        </div>
        <div class="arch-grid">
          ${renderArchitecture()}
        </div>
      </section>
    </main>

    <footer class="footer">
      <span>EduStar placeholder demo</span>
      <span>Node.js on Azure VM | Terraform managed</span>
    </footer>
  </div>
</body>
</html>`;
}

function proxyVideo(req, res) {
  const videoUrl = buildBlobVideoUrl();
  const range = req.headers.range || '';

  httpsGet(videoUrl, range, (upstream) => {
    if (upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
      httpsGet(upstream.headers.location, range, (redirected) => pipeVideoResponse(redirected, res)).on('error', () => {
        sendJson(res, 502, { error: 'Unable to read redirected video source' });
      });
      return;
    }

    pipeVideoResponse(upstream, res);
  }).on('error', () => {
    sendJson(res, 502, { error: 'Unable to read video source' });
  });
}

function httpsGet(url, range, callback) {
  const headers = {
    'User-Agent': 'edustar-placeholder-demo/1.0'
  };

  if (range) {
    headers.Range = range;
  }

  return require('https').get(url, {
    headers
  }, callback);
}

function pipeVideoResponse(upstream, res) {
  if (upstream.statusCode !== 200 && upstream.statusCode !== 206) {
    sendJson(res, upstream.statusCode || 502, { error: 'Video source unavailable' });
    upstream.resume();
    return;
  }

  const headers = {
    'Content-Type': upstream.headers['content-type'] || 'video/mp4',
    'Accept-Ranges': upstream.headers['accept-ranges'] || 'bytes',
    'Cache-Control': 'no-store'
  };

  if (upstream.headers['content-length']) {
    headers['Content-Length'] = upstream.headers['content-length'];
  }

  if (upstream.headers['content-range']) {
    headers['Content-Range'] = upstream.headers['content-range'];
  }

  res.writeHead(upstream.statusCode, headers);
  upstream.pipe(res);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  const pathname = requestUrl.pathname;

  if (pathname === '/') {
    sendHtml(res, renderHomePage());
    return;
  }

  if (pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      platform: 'EduStar',
      demo: 'scenario-5-placeholder',
      requirements: proofPoints.map((item) => item.label),
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === '/workloads' || pathname === '/courses') {
    sendJson(res, 200, { workloads });
    return;
  }

  if (pathname === '/media/demo-video') {
    proxyVideo(req, res);
    return;
  }

  if (pathname.startsWith('/assets/')) {
    serveAsset(res, pathname);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`EduStar placeholder demo running on port ${port}`);
});
