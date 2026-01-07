const fs = require('fs');
const path = require('path');

// Usage: node scripts/minify-env.js <filename.json>

const fileName = process.argv[2];

if (!fileName) {
  console.log('❌ Usage: node scripts/minify-env.js <your-firebase-key-file.json>');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), fileName);

try {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log('   Make sure you downloaded the file from Firebase Console!');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);
  const minified = JSON.stringify(json);

  console.log('\n✅ COPY THE LINE BELOW FOR VERCEL (FIREBASE_SERVICE_ACCOUNT_KEY):\n');
  console.log(minified);
  console.log('\n✅ END OF KEY\n');
  
} catch (error) {
  console.error('❌ Error parsing JSON:', error.message);
}
