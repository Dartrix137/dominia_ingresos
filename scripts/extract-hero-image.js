// Crop the cyborg from the source JPEG, removing ALL of the top text band.
// The original JPEG is 899x1600 (the FULL ticket sample).
// The cyborg occupies the top ~38% (~608px), but the brand text overlay
// "WELCOME TO" and "LSD | La Sucursal Digital" stretches across roughly
// the top ~250px of that hero band. We crop from y=250 down to y=608
// to keep just the lower face / shoulders of the cyborg, which is the
// most visually distinctive part (glowing eyes, neck circuits) while
// ensuring NO baked-in text remains.
const sharp = require('sharp');

const SRC = '/home/z/my-project/upload/WhatsApp Image 2026-07-22 at 2.27.45 PM.jpeg';
const OUT = '/home/z/my-project/public/assets/cyborg-hero.png';

(async () => {
  const meta = await sharp(SRC).metadata();
  console.log('Source:', meta.width, 'x', meta.height);

  const top = 250;
  const height = 608 - top; // 358px

  await sharp(SRC)
    .extract({ left: 0, top, width: meta.width, height })
    .modulate({
      brightness: 0.3,
      saturation: 0.7,
    })
    .blur(0.5)
    .resize({ width: 800, withoutEnlargement: true })
    .png()
    .toFile(OUT);

  console.log('Wrote cyborg hero (cropped from y=' + top + '):', OUT);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
