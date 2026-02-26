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
  <title>VRChat Avatar Finder</title>
  <style>
    body { font-family: Arial; background: #1a1a2e; color: white; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #00d4ff; text-align: center; }
    input { width: 90%; padding: 12px; margin: 10px 0; border: none; border-radius: 5px; font-size: 1em; }
    button { padding: 12px 20px; background: #a855f7; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .result { background: #16213e; padding: 20px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #a855f7; }
    .error { background: #ff6b6b; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
    img { width: 100%; max-width: 250px; border-radius: 5px; margin: 15px 0; }
    h2 { color: #00d4ff; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ VRChat Avatar Finder</h1>
    <p style="text-align: center; color: #a78bfa;">Search any VRChat username</p>
    
    <input type="text" id="username" placeholder="Enter VRChat username..." />
    <button onclick="search()">Search</button>
    
    <div id="output"></div>
  </div>

  <script>
    function search() {
      const username = document.getElementById('username').value.trim();
      
      if (!username) {
        document.getElementById('output').innerHTML = '<div class="error">Please enter a username</div>';
        return;
      }

      document.getElementById('output').innerHTML = '<div class="result">Searching for "' + username + '"...</div>';
      
      fetch('/search?username=' + encodeURIComponent(username))
        .then(r => r.json())
        .then(data => {
          if (data.error) {
            document.getElementById('output').innerHTML = '<div class="error">❌ ' + data.error + '</div>';
            return;
          }

          if (!data.name) {
            document.getElementById('output').innerHTML = '<div class="error">User not found</div>';
            return;
          }

          let html = '<div class="result">';
          html += '<h2>' + data.name + '</h2>';
          html += '<p style="color: #a78bfa;">@' + data.username + '</p>';
          
          if (data.avatarImage) {
            html += '<img src="' + data.avatarImage + '" alt="Avatar">';
          }
          
          if (data.bio) {
            html += '<p style="margin-top: 15px; color: #c084fc; font-style: italic;">' + data.bio + '</p>';
          }
          
          html += '<p style="margin-top: 15px;"><a href="https://www.vrchat.com/user/' + data.username + '" target="_blank" style="color: #00d4ff;">View Full Profile →</a></p>';
          html += '</div>';
          
          document.getElementById('output').innerHTML = html;
        })
        .catch(e => {
          document.getElementById('output').innerHTML = '<div class="error">Error: ' + e.message + '</div>';
        });
    }

    document.getElementById('username').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') search();
    });
  </script>
</body>
</html>`);
    return;
  }

  if (pathname === '/search' && query.username) {
    const username = query.username;
    const profileUrl = 'https://www.vrchat.com/user/' + username;
    
    console.log('Fetching profile:', profileUrl);

    https.get(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      let html = '';
      
      response.on('data', (chunk) => {
        html += chunk;
      });

      response.on('end', () => {
        try {
          // Extract avatar image
          const avatarMatch = html.match(/"currentAvatarImageUrl":"([^"]+)"/);
          const avatarImage = avatarMatch ? avatarMatch[1] : null;

          // Extract display name
          const nameMatch = html.match(/"displayName":"([^"]+)"/);
          const name = nameMatch ? nameMatch[1] : username;

          // Extract bio
          const bioMatch = html.match(/"bio":"([^"]+)"/);
          const bio = bioMatch ? bioMatch[1] : null;

          if (!name || name === 'null') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found or profile is private' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            username: username,
            name: name,
            avatarImage: avatarImage,
            bio: bio
          }));
        } catch (e) {
          console.error('Parse error:', e);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Could not parse profile' }));
        }
      });
    }).on('error', (err) => {
      console.error('Fetch error:', err);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Connection error: ' + err.message }));
    });

    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => {
  console.log('VRChat Avatar Finder running on port 3000');
});
