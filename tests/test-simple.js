const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Received request:', req.method, req.url);
  
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  
  res.end(JSON.stringify({ 
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    url: req.url
  }));
});

const PORT = 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test server accessible at http://localhost:${PORT}`);
  console.log(`Test server accessible at http://192.168.1.69:${PORT}`);
  console.log('Test server is ready to accept connections!');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
