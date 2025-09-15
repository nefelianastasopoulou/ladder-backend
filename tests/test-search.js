const http = require('http');

function testSearch() {
  console.log('Testing search endpoint...');
  
  const options = {
    hostname: '192.168.1.69',
    port: 3001,
    path: '/api/search/users?q=Regular',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
  });

  req.end();
}

testSearch();
