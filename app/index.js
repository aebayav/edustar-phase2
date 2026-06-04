const fs = require('fs');
const http = require('http');
const path = require('path');

const courses = [
  { id: 1, title: 'YKS Matematik', instructor: 'Ahmet Hoca', students: 1200, progress: 78, level: 'Advanced' },
  { id: 2, title: 'YKS Fizik', instructor: 'Ayse Hoca', students: 850, progress: 64, level: 'Core' },
  { id: 3, title: 'YKS Kimya', instructor: 'Mehmet Hoca', students: 920, progress: 71, level: 'Core' }
];

const highlights = [
  { label: 'Active learners', value: '2,970', detail: '+18% this month' },
  { label: 'Avg. completion', value: '71%', detail: 'Across YKS tracks' },
  { label: 'Video library', value: 'Blob', detail: 'Private Azure storage' },
  { label: 'API health', value: 'Live', detail: 'Node.js on VM' }
];

const infrastructure = [
  { title: 'Cloudflare', detail: 'Edge protection and HTTP routing' },
  { title: 'Azure VM', detail: 'Node.js API and demo shell' },
  { title: 'PostgreSQL', detail: 'Users, courses, enrollments' },
  { title: 'Blob Storage', detail: 'Secure lesson video assets' }
];

const videoConfig = {
  account: process.env.AZURE_STORAGE_ACCOUNT || 'edustarstorage',
  container: process.env.AZURE_STORAGE_CONTAINER || 'videos',
  blob: process.env.AZURE_STORAGE_BLOB || 'Test Video.mp4'
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
  const sasToken = (process.env.AZURE_STORAGE_SAS_TOKEN || '').replace(/^\?/, '');
  return sasToken ? `${baseUrl}?${sasToken}` : baseUrl;
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

function serveAsset(req, res, pathname) {
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

function renderCourseCards() {
  return courses.map((course) => `
    <article class="course-card">
      <div>
        <span class="eyebrow">${escapeHtml(course.level)}</span>
        <h3>${escapeHtml(course.title)}</h3>
        <p>${escapeHtml(course.instructor)} - ${course.students.toLocaleString('en-US')} students</p>
      </div>
      <div class="progress-row" aria-label="${escapeHtml(course.title)} completion ${course.progress}%">
        <span>${course.progress}%</span>
        <div class="meter"><i style="width: ${course.progress}%"></i></div>
      </div>
    </article>
  `).join('');
}

function renderHighlights() {
  return highlights.map((item) => `
    <article class="metric">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </article>
  `).join('');
}

function renderInfrastructure() {
  return infrastructure.map((item) => `
    <article class="infra-step">
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
  <title>EduStar Demo</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172026;
      --muted: #5b6773;
      --line: #d9e2ea;
      --panel: #ffffff;
      --soft: #f3f8f8;
      --teal: #0e9384;
      --blue: #285ec7;
      --yellow: #f2b705;
      --coral: #de5a4b;
      --shadow: 0 18px 48px rgba(22, 42, 55, 0.16);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: linear-gradient(180deg, #f7fbfb 0%, #edf5f4 42%, #f8fafb 100%);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .page {
      min-height: 100vh;
    }

    .topbar {
      align-items: center;
      background: rgba(255, 255, 255, 0.9);
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

    .status-pill {
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      display: inline-flex;
      font-size: 0.88rem;
      gap: 8px;
      padding: 8px 12px;
      white-space: nowrap;
    }

    .status-pill::before {
      background: #18a058;
      border-radius: 50%;
      content: "";
      display: inline-block;
      height: 8px;
      width: 8px;
    }

    .hero {
      display: grid;
      gap: clamp(24px, 4vw, 48px);
      grid-template-columns: minmax(0, 0.92fr) minmax(360px, 1.08fr);
      margin: 0 auto;
      max-width: 1240px;
      padding: clamp(34px, 6vw, 78px) clamp(20px, 5vw, 36px) 28px;
    }

    .hero-copy {
      align-self: center;
    }

    .eyebrow {
      color: var(--teal);
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(2.35rem, 5vw, 5rem);
      line-height: 0.98;
      margin-top: 14px;
      max-width: 720px;
    }

    .lead {
      color: var(--muted);
      font-size: clamp(1rem, 2vw, 1.18rem);
      line-height: 1.65;
      margin-top: 22px;
      max-width: 600px;
    }

    .hero-actions {
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
    }

    .button.primary {
      background: var(--ink);
      color: white;
    }

    .button.secondary {
      background: white;
      border: 1px solid var(--line);
      color: var(--ink);
    }

    .media-stage {
      align-self: center;
      background: #101820;
      border: 1px solid #26313b;
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
      background: rgba(16, 24, 32, 0.78);
      bottom: 0;
      color: white;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      left: 0;
      padding: 14px 16px;
      position: absolute;
      right: 0;
    }

    .media-caption strong {
      display: block;
      font-size: 0.95rem;
    }

    .media-caption span {
      color: rgba(255, 255, 255, 0.72);
      display: block;
      font-size: 0.82rem;
      margin-top: 3px;
      overflow-wrap: anywhere;
    }

    .play-badge {
      align-items: center;
      background: var(--yellow);
      border-radius: 999px;
      color: #211a00;
      display: inline-flex;
      flex: 0 0 auto;
      font-size: 0.86rem;
      font-weight: 900;
      height: 38px;
      justify-content: center;
      width: 38px;
    }

    .metrics {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin: 0 auto;
      max-width: 1240px;
      padding: 12px clamp(20px, 5vw, 36px) 34px;
    }

    .metric,
    .course-card,
    .video-panel,
    .infra-step {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }

    .metric {
      padding: 18px;
    }

    .metric span,
    .metric small {
      color: var(--muted);
      display: block;
      font-size: 0.9rem;
    }

    .metric strong {
      display: block;
      font-size: 1.9rem;
      line-height: 1.1;
      margin: 9px 0 5px;
    }

    .workspace {
      background: var(--soft);
      border-top: 1px solid var(--line);
      padding: clamp(34px, 5vw, 56px) clamp(20px, 5vw, 36px);
    }

    .workspace-inner {
      display: grid;
      gap: 22px;
      grid-template-columns: minmax(320px, 0.95fr) minmax(360px, 1.05fr);
      margin: 0 auto;
      max-width: 1240px;
    }

    .section-heading {
      align-items: end;
      display: flex;
      gap: 18px;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .section-heading h2 {
      font-size: clamp(1.45rem, 3vw, 2.3rem);
      line-height: 1.08;
    }

    .section-heading p {
      color: var(--muted);
      line-height: 1.55;
      max-width: 440px;
    }

    .course-list {
      display: grid;
      gap: 12px;
    }

    .course-card {
      display: grid;
      gap: 18px;
      grid-template-columns: minmax(0, 1fr) minmax(150px, 0.42fr);
      padding: 18px;
    }

    .course-card h3 {
      font-size: 1.12rem;
      margin-top: 6px;
    }

    .course-card p {
      color: var(--muted);
      font-size: 0.92rem;
      margin-top: 5px;
    }

    .progress-row {
      align-self: center;
      display: grid;
      gap: 8px;
    }

    .progress-row span {
      color: var(--ink);
      font-weight: 800;
      text-align: right;
    }

    .meter {
      background: #dce8eb;
      border-radius: 999px;
      height: 9px;
      overflow: hidden;
      width: 100%;
    }

    .meter i {
      background: linear-gradient(90deg, var(--teal), var(--blue));
      display: block;
      height: 100%;
    }

    .video-panel {
      overflow: hidden;
    }

    video {
      aspect-ratio: 16 / 9;
      background: #101820;
      display: block;
      width: 100%;
    }

    .video-meta {
      display: grid;
      gap: 12px;
      grid-template-columns: 1fr auto;
      padding: 18px;
    }

    .video-meta h2 {
      font-size: 1.28rem;
      line-height: 1.25;
    }

    .video-meta p {
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.55;
      margin-top: 5px;
    }

    .storage-tag {
      align-self: start;
      background: #fff7d6;
      border: 1px solid #f4d56f;
      border-radius: 999px;
      color: #6d5300;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 8px 10px;
      white-space: nowrap;
    }

    .infra {
      padding: clamp(34px, 5vw, 58px) clamp(20px, 5vw, 36px) clamp(46px, 6vw, 72px);
    }

    .infra-inner {
      margin: 0 auto;
      max-width: 1240px;
    }

    .infra-grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-top: 18px;
    }

    .infra-step {
      min-height: 166px;
      padding: 18px;
      position: relative;
    }

    .infra-step span {
      background: var(--coral);
      border-radius: 999px;
      display: block;
      height: 12px;
      margin-bottom: 26px;
      width: 42px;
    }

    .infra-step:nth-child(2) span {
      background: var(--blue);
    }

    .infra-step:nth-child(3) span {
      background: var(--teal);
    }

    .infra-step:nth-child(4) span {
      background: var(--yellow);
    }

    .infra-step h3 {
      font-size: 1.05rem;
      margin-bottom: 8px;
    }

    .infra-step p {
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.55;
    }

    @media (max-width: 980px) {
      .hero,
      .workspace-inner {
        grid-template-columns: 1fr;
      }

      .metrics,
      .infra-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .media-stage {
        order: -1;
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

      .metrics,
      .infra-grid {
        grid-template-columns: 1fr;
      }

      .course-card,
      .video-meta {
        grid-template-columns: 1fr;
      }

      .progress-row span {
        text-align: left;
      }

      .storage-tag {
        justify-self: start;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="topbar">
      <a class="brand" href="/">
        <span class="brand-mark">E</span>
        <span>EduStar</span>
      </a>
      <nav class="nav" aria-label="Demo sections">
        <a href="#courses">Courses</a>
        <a href="#video">Video</a>
        <a href="#infrastructure">Infrastructure</a>
        <a href="/courses">API</a>
      </nav>
      <span class="status-pill">Spain Central live</span>
    </header>

    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <span class="eyebrow">Online education platform</span>
        <h1 id="hero-title">EduStar learning dashboard</h1>
        <p class="lead">A compact demo for course discovery, video learning, learner progress, and the Azure-backed architecture behind the platform.</p>
        <div class="hero-actions">
          <a class="button primary" href="#video">Watch lesson</a>
          <a class="button secondary" href="/health">Check health</a>
        </div>
      </div>
      <div class="media-stage" aria-label="EduStar product preview">
        <img src="/assets/edustar-demo.png" alt="EduStar learning dashboard preview">
        <div class="media-caption">
          <div>
            <strong>Course analytics workspace</strong>
            <span>Students, lessons, progress, and content delivery in one view</span>
          </div>
          <span class="play-badge">▶</span>
        </div>
      </div>
    </section>

    <section class="metrics" aria-label="Platform metrics">
      ${renderHighlights()}
    </section>

    <section class="workspace" id="courses">
      <div class="workspace-inner">
        <div>
          <div class="section-heading">
            <div>
              <span class="eyebrow">Course catalog</span>
              <h2>YKS prep tracks</h2>
            </div>
          </div>
          <div class="course-list">
            ${renderCourseCards()}
          </div>
        </div>

        <article class="video-panel" id="video">
          <video controls preload="metadata" poster="/assets/edustar-demo.png">
            <source src="/media/demo-video" type="video/mp4">
          </video>
          <div class="video-meta">
            <div>
              <span class="eyebrow">Lesson video</span>
              <h2>Secure streaming from Azure Blob Storage</h2>
              <p>${escapeHtml(videoSourceLabel)}</p>
            </div>
            <span class="storage-tag">Blob video</span>
          </div>
        </article>
      </div>
    </section>

    <section class="infra" id="infrastructure">
      <div class="infra-inner">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Deployment path</span>
            <h2>From edge to private data</h2>
          </div>
          <p>Cloudflare fronts the public workload, Node.js serves the API on Azure VM, PostgreSQL stays private, and lesson videos live in Blob Storage.</p>
        </div>
        <div class="infra-grid">
          ${renderInfrastructure()}
        </div>
      </div>
    </section>
  </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/') {
    sendHtml(res, renderHomePage());
    return;
  }

  if (pathname === '/courses') {
    sendJson(res, 200, { status: 'ok', data: courses });
    return;
  }

  if (pathname === '/health') {
    sendJson(res, 200, {
      status: 'healthy',
      platform: 'EduStar',
      region: 'Spain Central',
      video: {
        source: 'Azure Blob Storage',
        account: videoConfig.account,
        container: videoConfig.container,
        blob: videoConfig.blob,
        configuredWithSas: Boolean(process.env.EDUSTAR_VIDEO_URL || process.env.AZURE_STORAGE_SAS_TOKEN)
      }
    });
    return;
  }

  if (pathname === '/media/demo-video') {
    res.writeHead(302, {
      Location: buildBlobVideoUrl(),
      'Cache-Control': 'no-store'
    });
    res.end();
    return;
  }

  if (pathname.startsWith('/assets/')) {
    serveAsset(req, res, pathname);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`EduStar demo running on port ${port}`);
  console.log(`Video source: ${videoConfig.account}/${videoConfig.container}/${videoConfig.blob}`);
});
