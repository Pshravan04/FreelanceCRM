const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImagePath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\df8e44d4-d2a7-480e-a0d1-2b49729b25f1\\crm_app_icon_1791351730742.jpg';
const outputDir = path.join(__dirname, 'public', 'icons');

async function processImages() {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await sharp(inputImagePath).resize(192, 192).toFile(path.join(outputDir, 'icon-192.png'));
    console.log('Created icon-192.png');
    
    await sharp(inputImagePath).resize(512, 512).toFile(path.join(outputDir, 'icon-512.png'));
    console.log('Created icon-512.png');
    
    await sharp(inputImagePath).resize(180, 180).toFile(path.join(outputDir, 'icon-180.png'));
    console.log('Created icon-180.png');
    
    await sharp(inputImagePath).resize(180, 180).toFile(path.join(__dirname, 'public', 'apple-icon.png'));
    console.log('Created apple-icon.png in public/');
  } catch (err) {
    console.error('Error processing images:', err);
  }
}

processImages();
