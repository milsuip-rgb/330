const https = require('https');

https.get('https://www.beobjin.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    // Extract phone numbers
    const phoneRegex = /\d{2,4}-\d{3,4}-\d{4}/g;
    const phones = data.match(phoneRegex);
    console.log('Phones:', [...new Set(phones)]);
    
    // Extract text content roughly
    const text = data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ');
    
    // Look for lawyer names (변호사)
    const lawyerRegex = /([가-힣]{2,4})\s*변호사/g;
    const lawyers = [];
    let match;
    while ((match = lawyerRegex.exec(text)) !== null) {
      lawyers.push(match[0]);
    }
    console.log('Lawyers:', [...new Set(lawyers)]);
    
    // Look for company info
    const addressRegex = /주소[^<]*/g;
    console.log('Address:', text.match(/주소.*?(?=\s{2,})/g));
    
    console.log('Text snippet:', text.substring(0, 2000));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
