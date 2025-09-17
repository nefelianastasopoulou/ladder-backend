#!/usr/bin/env node

// Performance Testing Script
// This script runs basic performance tests on the application

const fs = require('fs');
const path = require('path');

// Performance test configuration
const config = {
  iterations: 100,
  warmupIterations: 10,
  testTimeout: 30000
};

// Performance test results
const results = {
  bundleSize: null,
  loadTime: null,
  memoryUsage: null,
  tests: []
};

// Test bundle size
const testBundleSize = () => {
  try {
    const bundlePath = path.join(__dirname, '../dist');
    
    if (!fs.existsSync(bundlePath)) {
      console.log('⚠️  Bundle not found. Run "npm run build:web" first.');
      return null;
    }
    
    const getDirectorySize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          size += getDirectorySize(filePath);
        } else {
          size += stat.size;
        }
      }
      
      return size;
    };
    
    const size = getDirectorySize(bundlePath);
    const sizeKB = Math.round(size / 1024);
    const sizeMB = Math.round(size / (1024 * 1024) * 100) / 100;
    
    console.log(`📦 Bundle size: ${sizeKB} KB (${sizeMB} MB)`);
    
    return {
      bytes: size,
      kb: sizeKB,
      mb: sizeMB
    };
    
  } catch (error) {
    console.error('❌ Bundle size test failed:', error.message);
    return null;
  }
};

// Test memory usage
const testMemoryUsage = () => {
  try {
    const memUsage = process.memoryUsage();
    
    const formatBytes = (bytes) => {
      return Math.round(bytes / 1024 / 1024 * 100) / 100;
    };
    
    const result = {
      rss: formatBytes(memUsage.rss),
      heapTotal: formatBytes(memUsage.heapTotal),
      heapUsed: formatBytes(memUsage.heapUsed),
      external: formatBytes(memUsage.external)
    };
    
    console.log(`🧠 Memory usage: ${result.heapUsed} MB (heap)`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Memory usage test failed:', error.message);
    return null;
  }
};

// Test file system performance
const testFileSystemPerformance = async () => {
  try {
    const testDir = path.join(__dirname, '../temp-performance-test');
    const testFile = path.join(testDir, 'test.txt');
    const testData = 'x'.repeat(1024 * 1024); // 1MB of data
    
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const times = [];
    
    // Test write performance
    for (let i = 0; i < config.iterations; i++) {
      const start = process.hrtime.bigint();
      fs.writeFileSync(testFile, testData);
      const end = process.hrtime.bigint();
      
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      times.push(duration);
    }
    
    // Test read performance
    const readTimes = [];
    for (let i = 0; i < config.iterations; i++) {
      const start = process.hrtime.bigint();
      fs.readFileSync(testFile);
      const end = process.hrtime.bigint();
      
      const duration = Number(end - start) / 1000000;
      readTimes.push(duration);
    }
    
    // Cleanup
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir);
    
    const avgWriteTime = times.reduce((a, b) => a + b, 0) / times.length;
    const avgReadTime = readTimes.reduce((a, b) => a + b, 0) / readTimes.length;
    
    console.log(`💾 File system performance:`);
    console.log(`   Write: ${avgWriteTime.toFixed(2)}ms avg`);
    console.log(`   Read: ${avgReadTime.toFixed(2)}ms avg`);
    
    return {
      writeTime: avgWriteTime,
      readTime: avgReadTime,
      iterations: config.iterations
    };
    
  } catch (error) {
    console.error('❌ File system performance test failed:', error.message);
    return null;
  }
};

// Test JavaScript performance
const testJavaScriptPerformance = () => {
  try {
    const times = [];
    
    // Test array operations
    for (let i = 0; i < config.iterations; i++) {
      const start = process.hrtime.bigint();
      
      // Create and manipulate large array
      const arr = new Array(10000).fill(0).map((_, index) => index);
      arr.sort((a, b) => b - a);
      arr.filter(x => x % 2 === 0);
      arr.map(x => x * 2);
      
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;
      times.push(duration);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    
    console.log(`⚡ JavaScript performance: ${avgTime.toFixed(2)}ms avg`);
    
    return {
      avgTime,
      iterations: config.iterations
    };
    
  } catch (error) {
    console.error('❌ JavaScript performance test failed:', error.message);
    return null;
  }
};

// Generate performance report
const generateReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    results
  };
  
  const reportPath = path.join(__dirname, '../performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 Performance report saved to: ${reportPath}`);
  
  // Print summary
  console.log('\n📋 Performance Test Summary:');
  console.log('============================');
  
  if (results.bundleSize) {
    console.log(`Bundle Size: ${results.bundleSize.mb} MB`);
  }
  
  if (results.memoryUsage) {
    console.log(`Memory Usage: ${results.memoryUsage.heapUsed} MB`);
  }
  
  results.tests.forEach(test => {
    console.log(`${test.name}: ${test.result}`);
  });
};

// Main performance test function
const runPerformanceTests = async () => {
  try {
    console.log('🚀 Starting performance tests...');
    console.log(`📋 Configuration: ${config.iterations} iterations, ${config.warmupIterations} warmup`);
    
    // Test bundle size
    console.log('\n📦 Testing bundle size...');
    results.bundleSize = testBundleSize();
    
    // Test memory usage
    console.log('\n🧠 Testing memory usage...');
    results.memoryUsage = testMemoryUsage();
    
    // Test file system performance
    console.log('\n💾 Testing file system performance...');
    const fsResult = await testFileSystemPerformance();
    if (fsResult) {
      results.tests.push({
        name: 'File System',
        result: `Write: ${fsResult.writeTime.toFixed(2)}ms, Read: ${fsResult.readTime.toFixed(2)}ms`
      });
    }
    
    // Test JavaScript performance
    console.log('\n⚡ Testing JavaScript performance...');
    const jsResult = testJavaScriptPerformance();
    if (jsResult) {
      results.tests.push({
        name: 'JavaScript',
        result: `${jsResult.avgTime.toFixed(2)}ms avg`
      });
    }
    
    // Generate report
    generateReport();
    
    console.log('\n🎉 Performance tests completed!');
    
  } catch (error) {
    console.error('💥 Performance tests failed:', error);
    process.exit(1);
  }
};

// Run tests if this script is executed directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = { runPerformanceTests };
