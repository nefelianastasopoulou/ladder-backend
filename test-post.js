const http = require('http');

// First, let's sign in a user to get a token
const signinData = JSON.stringify({
  email: 'test@test.com',
  password: 'password123'
});

const signinOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/signin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(signinData)
  }
};

console.log('Testing signin...');
const signinReq = http.request(signinOptions, (res) => {
  console.log(`Signin Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Signin Response:', data);
    
    try {
      const signinResult = JSON.parse(data);
      if (signinResult.token) {
        console.log('Got token, now testing opportunity creation...');
        testCreateOpportunity(signinResult.token);
      } else {
        console.log('No token received');
      }
    } catch (e) {
      console.log('Error parsing signin response:', e.message);
    }
  });
});

signinReq.on('error', (e) => {
  console.error(`Signin request error: ${e.message}`);
});

signinReq.write(signinData);
signinReq.end();

function testCreateOpportunity(token) {
  const opportunityData = JSON.stringify({
    title: 'Test Opportunity',
    description: 'This is a test opportunity',
    category: 'Internships',
    location: 'Remote',
    field: 'Technology'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/opportunities',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(opportunityData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Create Opportunity Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Create Opportunity Response:', data);
      
      // Now test getting opportunities
      setTimeout(() => {
        testGetOpportunities();
      }, 1000);
    });
  });

  req.on('error', (e) => {
    console.error(`Create opportunity request error: ${e.message}`);
  });

  req.write(opportunityData);
  req.end();
}

function testGetOpportunities() {
  console.log('Testing get opportunities...');
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/opportunities',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Get Opportunities Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Get Opportunities Response:', data);
      try {
        const opportunities = JSON.parse(data);
        console.log(`Number of opportunities: ${opportunities.length}`);
        if (opportunities.length > 0) {
          console.log('First opportunity:', opportunities[0]);
        }
      } catch (e) {
        console.log('Error parsing opportunities:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Get opportunities request error: ${e.message}`);
  });

  req.end();
}
