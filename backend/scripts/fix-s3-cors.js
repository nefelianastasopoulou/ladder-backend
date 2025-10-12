const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Configure AWS S3 Client
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3000
    }
  ]
};

async function fixS3Cors() {
  try {
    console.log('🔧 Fixing CORS configuration for S3 bucket:', BUCKET_NAME);
    console.log('📍 Region:', process.env.AWS_REGION || 'us-east-1');
    
    // Check if credentials are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('❌ AWS credentials not found in environment variables!');
      console.error('Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set.');
      process.exit(1);
    }
    
    if (!BUCKET_NAME) {
      console.error('❌ AWS_S3_BUCKET_NAME not found in environment variables!');
      process.exit(1);
    }
    
    // Get current CORS configuration (if any)
    try {
      console.log('📋 Checking current CORS configuration...');
      const getCurrentCors = new GetBucketCorsCommand({ Bucket: BUCKET_NAME });
      const currentCors = await s3Client.send(getCurrentCors);
      console.log('📋 Current CORS:', JSON.stringify(currentCors.CORSRules, null, 2));
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.log('📋 No CORS configuration currently exists.');
      } else {
        console.warn('⚠️ Could not fetch current CORS:', error.message);
      }
    }
    
    // Update CORS configuration
    console.log('🚀 Updating CORS configuration...');
    const command = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    });
    
    await s3Client.send(command);
    
    console.log('✅ CORS configuration updated successfully!');
    console.log('📝 New CORS rules:');
    console.log(JSON.stringify(corsConfiguration.CORSRules, null, 2));
    console.log('');
    console.log('🎉 Your images should now load in the app!');
    console.log('💡 Try reloading your app and viewing posts with images.');
    
  } catch (error) {
    console.error('❌ Error updating CORS configuration:', error);
    console.error('Error details:', error.message);
    
    if (error.name === 'AccessDenied') {
      console.error('');
      console.error('🔒 Access Denied - Your AWS credentials might not have permission to update CORS.');
      console.error('You need to either:');
      console.error('1. Sign in to AWS Console and update CORS manually');
      console.error('2. Update your IAM user permissions to allow s3:PutBucketCORS');
    } else if (error.name === 'NoSuchBucket') {
      console.error('');
      console.error('🪣 Bucket not found:', BUCKET_NAME);
      console.error('Make sure the AWS_S3_BUCKET_NAME environment variable is correct.');
    }
    
    process.exit(1);
  }
}

// Run the script
fixS3Cors();

