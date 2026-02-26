const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname === '/') {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>VRChat Finder</title>
  <style>
    body {
      font-family: Arial;
      background: #1a1a2e;
      color: white;
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
    }
    h1 {
      color: #00d4ff;
      text-align: center;
    }
    input {
      width: 70%;
      padding: 10px;
      margin: 10px 0;
      border: none;
      border-radius: 5px;
      font-size: 1em;
    }
    button {
      padding: 10px 20px;
      background: #a855f7;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      font-size: 1em;
    }
    button:hover {
      background: #9333ea;
    }
    .result {
      background: #16213e;
      padding: 20px;
      margin-top: 20px;
      border-radius: 5px;
      border-left: 4px solid #a855f7;
    }
    .error {
      background: #ff6b6b;
      padding: 10px;
      margin-top: 10px;
      border-radius: 5px;
    }
    img {
      width: 100%;
      max-width: 200px;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>VRChat Avatar Finder</h1>
    <div>
      <input type="text" id="username" placeholder="Enter username..." />
      <br>
      <button onclick="doSearch()">Search</button>
    </div>
    <div id="output"></div>
  </div>

  <script>
    function doSearch() {
      const username = document.getElementById('username').value;
      
      if (!username) {
        alert('Please enter a username');
        return;
      }

      document.getElementById('output').innerHTML = '<div class="result">Searching...</div>';
      
      console.log('Searching for:', username);

      fetch('/search?username=' + encodeURIComponent(username))
        .then(response => response.json())
        .then(data => {
          console.log('Got data:', data);
          
          if (!data || !data.username) {
            document.getElementById('output').innerHTML = '<div class="error">User not found</div>';
            return;
          }

          let html = '<div class="result">';
          html += '<h2>' + data.displayName + '</h2>';
          html += '<p>@' + data.username + '</p>';
          
          if (data.currentAvatarImageUrl) {
            html += '<img src="' + data.currentAvatarImageUrl + '" />';
          }
          
          html += '</div>';
          
          document.getElementById('output').innerHTML = html;
        })
        .catch(error => {
          console.error('Error:', error);
          document.getElementById('output').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
        });
    }

    document.getElementById('username').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        doSearch();
      }
    });
  </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Search endpoint
  if (pathname === '/search' && query.username) {
    const username = query.username;
    console.log('API: Searching for', username);

    https.get('https://api.vrchat.cloud/api/1/users/' + username, (response) => {
      let body = '';
      
      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        console.log('API Response code:', response.statusCode);
        console.log('API Response length:', body.length);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);
      });

    }).on('error', (error) => {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    });

    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
