// Test PDF generation with sample data — for visual inspection only.
// Output: /home/z/my-project/download/test-ticket.pdf

const { generateTicketPdf } = require('../src/lib/pdf.ts');

(async () => {
  const pdf = await generateTicketPdf({
    attendee: {
      fullName: 'Johnny Paz',
      cedula: '1144058864',
      locality: 'VIP',
    },
    qrPayload: 'https://dominia.example.com/v/test-uuid-1234',
  });

  const fs = require('fs');
  fs.mkdirSync('/home/z/my-project/download', { recursive: true });
  fs.writeFileSync('/home/z/my-project/download/test-ticket.pdf', pdf);
  console.log('Wrote test PDF:', '/home/z/my-project/download/test-ticket.pdf', pdf.length, 'bytes');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
