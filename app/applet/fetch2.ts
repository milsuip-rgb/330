import https from 'https';

https.get('https://www.beobjin.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const links = data.match(/href="([^"]*)"[^>]*>구성원 소개/g);
    console.log('Links:', links);
  });
});
