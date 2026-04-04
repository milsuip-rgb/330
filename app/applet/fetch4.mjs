import https from 'https';

https.get('https://www.beobjin.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const text = data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ');
    const addressMatch = text.match(/수원시[^ ]* [^ ]* [^ ]* [^ ]*/);
    console.log('Address:', addressMatch);
    
    // Let's just print the last 500 characters of text which usually contains the footer
    console.log('Footer text:', text.substring(text.length - 1000));
  });
});
