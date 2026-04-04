import https from 'https';

https.get('https://beobjin-criminal.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/g;
    let match;
    const logos = [];
    while ((match = imgRegex.exec(data)) !== null) {
      if (match[1].toLowerCase().includes('logo') || match[0].toLowerCase().includes('logo')) {
        logos.push(match[1]);
      }
    }
    console.log('Logos found:', logos);
  });
});
