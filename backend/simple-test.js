const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Simple HTTP server is working!' }));
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Simple HTTP server running on port 8080');
  console.log('Access at http://localhost:8080');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

