import https from 'https';

https.get('https://www.beobjin.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const links = data.match(/href="([^"]*)"/g);
    console.log('Links:', links ? links.filter(l => l.includes('lawyer') || l.includes('member') || l.includes('about')) : []);
  });
});
