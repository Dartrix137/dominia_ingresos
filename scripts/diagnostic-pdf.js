// Diagnostic: generate a PDF WITHOUT the cyborg image to isolate whether
// the "duplicated WELCOME TO" is coming from the cyborg source image
// or from a bug in the layout code.
import { jsPDF } from 'jspdf';

const PAGE_W = 90;
const PAGE_H = 160;
const C = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  neonGreen: [0, 255, 136],
  violet: [139, 0, 255],
};

const doc = new jsPDF({ unit: 'mm', format: [PAGE_W, PAGE_H], orientation: 'portrait' });

// Black background
doc.setFillColor(...C.black);
doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

// Header band
const headerH = 14;
doc.setFillColor(...C.black);
doc.rect(0, 0, PAGE_W, headerH, 'F');

// "WELCOME TO" top-left
doc.setTextColor(...C.white);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('WELCOME TO', 4, 6);

// Brand top-right
doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.text('LSD', PAGE_W - 4, 8, { align: 'right' });
doc.setFont('helvetica', 'normal');
doc.setFontSize(5);
doc.text('La Sucursal Digital', PAGE_W - 4, 12, { align: 'right' });

// Empty hero zone (no cyborg)
doc.setFillColor(20, 20, 30);
doc.rect(0, headerH, PAGE_W, 38, 'F');

const fs = require('fs');
fs.writeFileSync('/home/z/my-project/download/diagnostic.pdf', Buffer.from(doc.output('arraybuffer')));
console.log('Wrote diagnostic PDF');
