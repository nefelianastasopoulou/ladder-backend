const http = require('http');

// First, we need to get a valid JWT token by logging in
const loginData = JSON.stringify({
  email: '@',
  password: 'password' // Replace with actual password
});

const loginOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/signin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

console.log('Logging in to get token...');

const loginReq = http.request(loginOptions, (loginRes) => {
  let data = '';
  
  loginRes.on('data', (chunk) => {
    data += chunk;
  });
  
  loginRes.on('end', () => {
    try {
      const loginResponse = JSON.parse(data);
      console.log('Login response:', loginResponse);
      
      if (loginResponse.token) {
        // Now test the profile API with the token
        testProfileAPI(loginResponse.token);
      } else {
        console.log('No token received');
      }
    } catch (error) {
      console.error('Error parsing login response:', error);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('Login request error:', error);
});

loginReq.write(loginData);
loginReq.end();

function testProfileAPI(token) {
  console.log('\nTesting profile API with token...');
  
  const profileOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  const profileReq = http.request(profileOptions, (profileRes) => {
    let data = '';
    
    profileRes.on('data', (chunk) => {
      data += chunk;
    });
    
    profileRes.on('end', () => {
      try {
        const profileResponse = JSON.parse(data);
        console.log('Profile API response:');
        console.log(JSON.stringify(profileResponse, null, 2));
        console.log('\nIs admin field present:', 'is_admin' in profileResponse);
        console.log('Is admin value:', profileResponse.is_admin);
      } catch (error) {
        console.error('Error parsing profile response:', error);
        console.log('Raw response:', data);
      }
    });
  });
  
  profileReq.on('error', (error) => {
    console.error('Profile request error:', error);
  });
  
  profileReq.end();
}
