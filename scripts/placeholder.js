const fs = require('fs');
const { getPixelsCSS } = require('@plaiceholder/css');

async function generatePlaceholderCSS(file) {
  const image = fs.readFileSync(file);
  const css = await getPixelsCSS(image);
  console.log(css);
}

if (require.main === module) generatePlaceholderCSS('../public/rockets.gif');
