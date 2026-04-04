import https from 'https';

https.get('https://www.beobjin.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const phoneRegex = /\d{2,4}-\d{3,4}-\d{4}/g;
    const phones = data.match(phoneRegex);
    console.log('Phones:', [...new Set(phones)]);
    
    const text = data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ');
    
    const lawyerRegex = /([가-힣]{2,4})\s*변호사/g;
    const lawyers = [];
    let match;
    while ((match = lawyerRegex.exec(text)) !== null) {
      lawyers.push(match[0]);
    }
    console.log('Lawyers:', [...new Set(lawyers)]);
    
    console.log('Text snippet:', text.substring(0, 1000));
  });
});
