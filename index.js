const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>VRChat Finder</title>
  <style>
    body { font-family: Arial; background: #1a1a2e; color: white; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; }
    h1 { color: #00d4ff; text-align: center; }
    input { width: 90%; padding: 10px; margin: 10px 0; border: none; border-radius: 5px; }
    button { padding: 10px 20px; background: #a855f7; color: white; border: none; border-radius: 5px; cursor: pointer; }
    .result { background: #16213e; padding: 20px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #a855f7; }
    .error { background: #ff6b6b; padding: 10px; margin-top: 10px; border-radius: 5px; }
    img { width: 100%; max-width: 200px; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>VRChat Avatar Finder</h1>
    <input type="text" id="username" placeholder="Enter username..." />
    <button onclick="doSearch()">Search</button>
    <div id="output"></div>
  </div>

  <script>
    function doSearch() {
      const username = document.getElementById('username').value.trim();
      
      if (!username) {
        document.getElementById('output').innerHTML = '<div class="error">Please enter username</div>';
        return;
      }

      document.getElementById('output').innerHTML = '<div class="result">Searching for: ' + username + '...</div>';
      
      fetch('/search?username=' + encodeURIComponent(username))
        .then(r => r.text())
        .then(text => {
          console.log('Raw response:', text);
          
          try {
            const data = JSON.parse(text);
            console.log('Parsed data:', data);
            
            if (data.error) {
              document.getElementById('output').innerHTML = '<div class="error">Error: ' + data.error + '</div>';
              return;
            }

            if (data.debug) {
              document.getElementById('output').innerHTML = '<div class="error">Debug: ' + data.debug + '</div>';
              return;
            }

            if (!data.username && !data.displayName) {
              document.getElementById('output').innerHTML = '<div class="error">User not found or VRChat API error</div>';
              return;
            }

            let html = '<div class="result">';
            html += '<h2>' + (data.displayName || data.username) + '</h2>';
            html += '<p>@' + data.username + '</p>';
            
            if (data.currentAvatarImageUrl) {
              html += '<img src="' + data.currentAvatarImageUrl + '" />';
            }
            
            html += '</div>';
            
            document.getElementById('output').innerHTML = html;
          } catch (e) {
            document.getElementById('output').innerHTML = '<div class="error">Parse error: ' + e.message + '<br><br>Response: ' + text.substring(0, 200) + '</div>';
          }
        })
        .catch(e => {
          document.getElementById('output').innerHTML = '<div class="error">Fetch error: ' + e.message + '</div>';
        });
    }

    document.getElementById('username').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') doSearch();
    });
  </script>
</body>
</html>`);
    return;
  }

  if (pathname === '/search' && query.username) {
    const username = query.username;
    
    console.log('=== Searching for user:', username);

    const apiUrl = 'https://api.vrchat.cloud/api/1/users/' + username;
    console.log('VRChat API URL:', apiUrl);

    https.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (response) => {
      console.log('Status code:', response.statusCode);
      console.log('Headers:', response.headers);
      
      let body = '';
      
      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        console.log('Response body length:', body.length);
        console.log('First 200 chars:', body.substring(0, 200));
        
        if (body.includes('401') || body.includes('Unauthorized')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'VRChat API requires authentication' }));
          return;
        }

        if (body.includes('404') || body.includes('Not Found')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found on VRChat' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);
      });

    }).on('error', (error) => {
      console.error('HTTPS error:', error.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Connection error: ' + error.message }));
    });

    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
