const fs = require('fs');
const { getPixelsCSS } = require('@plaiceholder/css');
const { getBase64 } = require('@plaiceholder/base64');

async function generatePlaceholderCSS(file) {
  const image = fs.readFileSync(file);
  const css = await getPixelsCSS(image);
  console.log('CSS:', css);
  const base64 = await getBase64(image);
  console.log('Base64:', base64);
}

if (require.main === module)
  generatePlaceholderCSS('../public/images/hammock-webclip.png');
