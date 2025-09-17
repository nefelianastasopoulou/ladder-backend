#!/usr/bin/env node

// Image Optimization Script
// This script optimizes images for better performance

const fs = require('fs');
const path = require('path');

// Image optimization configuration
const config = {
  inputDir: path.join(__dirname, '../assets/images'),
  outputDir: path.join(__dirname, '../assets/images/optimized'),
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  formats: ['jpg', 'png', 'webp']
};

// Check if sharp is available (optional dependency)
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('⚠️  Sharp not installed. Install with: npm install sharp');
  console.log('📝 Skipping image optimization...');
  process.exit(0);
}

// Create output directory if it doesn't exist
const ensureOutputDir = () => {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
};

// Get all image files
const getImageFiles = () => {
  const files = fs.readdirSync(config.inputDir);
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });
};

// Optimize a single image
const optimizeImage = async (filename) => {
  const inputPath = path.join(config.inputDir, filename);
  const nameWithoutExt = path.parse(filename).name;
  
  try {
    console.log(`🔄 Optimizing: ${filename}`);
    
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Resize if necessary
    if (metadata.width > config.maxWidth || metadata.height > config.maxHeight) {
      image.resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Generate optimized versions
    const promises = [];
    
    // JPEG version
    promises.push(
      image.clone()
        .jpeg({ quality: config.quality })
        .toFile(path.join(config.outputDir, `${nameWithoutExt}.jpg`))
    );
    
    // WebP version
    promises.push(
      image.clone()
        .webp({ quality: config.quality })
        .toFile(path.join(config.outputDir, `${nameWithoutExt}.webp`))
    );
    
    await Promise.all(promises);
    
    console.log(`✅ Optimized: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Failed to optimize ${filename}:`, error.message);
  }
};

// Main optimization function
const optimizeImages = async () => {
  try {
    console.log('🚀 Starting image optimization...');
    
    ensureOutputDir();
    
    const imageFiles = getImageFiles();
    
    if (imageFiles.length === 0) {
      console.log('📝 No images found to optimize');
      return;
    }
    
    console.log(`📋 Found ${imageFiles.length} images to optimize`);
    
    // Optimize all images
    for (const file of imageFiles) {
      await optimizeImage(file);
    }
    
    console.log('🎉 Image optimization completed!');
    
  } catch (error) {
    console.error('💥 Image optimization failed:', error);
    process.exit(1);
  }
};

// Run optimization if this script is executed directly
if (require.main === module) {
  optimizeImages();
}

module.exports = { optimizeImages };
