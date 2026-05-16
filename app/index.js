const http = require('http');

const courses = [
  { id: 1, title: 'YKS Matematik', instructor: 'Ahmet Hoca', students: 1200 },
  { id: 2, title: 'YKS Fizik', instructor: 'Ayse Hoca', students: 850 },
  { id: 3, title: 'YKS Kimya', instructor: 'Mehmet Hoca', students: 920 }
];

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/courses') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', data: courses }));
  } else if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'healthy', platform: 'EduStar' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(80, () => {
  console.log('EduStar API running on port 80');
});