const sharp = require('sharp');
const fs = require('fs');

async function resizeImage() {
  const input = 'public/imageholder.jpg';
  const output = 'public/imageholder_wide.jpg';
  
  await sharp(input)
    .resize({
      width: 1200,
      height: 630,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toFile(output);
    
  fs.renameSync(output, input);
  console.log('Done');
}

resizeImage().catch(console.error);
