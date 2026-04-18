// سكريبت ضغط الصور وتحويلها لـ WebP
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = './public';

async function compressImage(inputPath, outputPath, options = {}) {
  const inputSize = fs.statSync(inputPath).size;
  
  let chain = sharp(inputPath);
  
  if (options.resize) {
    chain = chain.resize(options.resize.width, options.resize.height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  
  // حفظ WebP بجانب الأصل
  const webpPath = outputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  await chain
    .webp({ quality: 85, effort: 6 })
    .toFile(webpPath);
  
  const webpSize = fs.statSync(webpPath).size;
  
  // ضغط PNG الأصلي أيضاً (للتوافق)
  await sharp(inputPath)
    .png({ compressionLevel: 9, quality: 85 })
    .toFile(outputPath + '.compressed.png');
  
  const compressedSize = fs.statSync(outputPath + '.compressed.png').size;
  
  console.log(`✅ ${path.basename(inputPath)}`);
  console.log(`   قبل:    ${(inputSize / 1024).toFixed(1)} KB`);
  console.log(`   WebP:   ${(webpSize / 1024).toFixed(1)} KB  (${Math.round((1 - webpSize/inputSize)*100)}% أصغر)`);
  console.log(`   PNG:    ${(compressedSize / 1024).toFixed(1)} KB`);
  console.log('');
  
  return { webpPath, compressedPng: outputPath + '.compressed.png' };
}

async function main() {
  console.log('🚀 بدء ضغط الصور...\n');
  
  const images = [
    { 
      input:  `${PUBLIC_DIR}/logo.png`,
      output: `${PUBLIC_DIR}/logo.png`,
      resize: null
    },
    { 
      input:  `${PUBLIC_DIR}/logo-v2.png`,
      output: `${PUBLIC_DIR}/logo-v2.png`,
      resize: null
    },
    { 
      input:  `${PUBLIC_DIR}/icons/icon-192x192.png`,
      output: `${PUBLIC_DIR}/icons/icon-192x192.png`,
      resize: { width: 192, height: 192 }
    },
    { 
      input:  `${PUBLIC_DIR}/icons/icon-512x512.png`,
      output: `${PUBLIC_DIR}/icons/icon-512x512.png`,
      resize: { width: 512, height: 512 }
    },
  ];
  
  for (const img of images) {
    if (!fs.existsSync(img.input)) {
      console.log(`⚠️  ${img.input} غير موجود`);
      continue;
    }
    await compressImage(img.input, img.output, { resize: img.resize });
  }
  
  console.log('\n📋 الخطوة التالية:');
  console.log('   استبدل الملفات القديمة بالمضغوطة:');
  console.log('   - أعد تسمية logo.png.compressed.png → logo.png');
  console.log('   - أعد تسمية logo-v2.png.compressed.png → logo-v2.png');
  console.log('   - أعد تسمية icon-192x192.png.compressed.png → icon-192x192.png');
  console.log('   - أعد تسمية icon-512x512.png.compressed.png → icon-512x512.png');
}

main().catch(console.error);
