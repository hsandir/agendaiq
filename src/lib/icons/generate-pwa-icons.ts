// Script to generate placeholder PWA icons
import * as fs from 'fs';
import * as path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgContent = `<svg width="SIZE" height="SIZE" viewBox="0 0 SIZE SIZE" xmlns="http://www.w3.org/2000/svg">
  <rect width="SIZE" height="SIZE" fill="#2563eb" rx="20%"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="FONTSIZE" font-weight="bold" fill="white">AQ</text>
</svg>`;

export function generatePWAIcons() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  sizes.forEach(size => {
    const fontSize = Math.floor(size * 0.4);
    const svg = svgContent
      .replace(/SIZE/g, size.toString())
      .replace('FONTSIZE', fontSize.toString());
    
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, svg);
    console.log(`Created ${filename}`);
  });
}

// Run if called directly
if (require.main === module) {
  generatePWAIcons();
}