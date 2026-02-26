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
          console.log('Response:', data);
          
          if (data.error) {
            document.getElementById('output').innerHTML = '<div class="error">❌ ' + data.error + '</div>';
            return;
          }

          if (!data.name && !data.username) {
            document.getElementById('output').innerHTML = '<div class="error">❌ User not found or profile is private</div>';
            return;
          }

          let html = '<div class="result">';
          html += '<h2>' + (data.name || data.username) + '</h2>';
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
    
    console.log('Fetching:', profileUrl);

    https.get(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (response) => {
      let html = '';
      
      response.on('data', (chunk) => {
        html += chunk;
      });

      response.on('end', () => {
        try {
          console.log('Response length:', html.length);
          console.log('First 500 chars:', html.substring(0, 500));
          
          // Try multiple parsing methods
          let name = null;
          let avatarImage = null;
          let bio = null;

          // Method 1: Look for "displayName" in JSON
          const nameMatch1 = html.match(/"displayName"\s*:\s*"([^"]+)"/);
          if (nameMatch1) name = nameMatch1[1];

          // Method 2: Look for name in meta tags
          const nameMatch2 = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
          if (nameMatch2 && !name) name = nameMatch2[1];

          // Method 3: Look for avatar image
          const avatarMatch1 = html.match(/"currentAvatarImageUrl"\s*:\s*"([^"]+)"/);
          if (avatarMatch1) avatarImage = avatarMatch1[1];

          // Method 4: Look for avatar in og:image
          const avatarMatch2 = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
          if (avatarMatch2 && !avatarImage) avatarImage = avatarMatch2[1];

          // Method 5: Extract bio
          const bioMatch = html.match(/"bio"\s*:\s*"([^"]+)"/);
          if (bioMatch) bio = bioMatch[1];

          console.log('Extracted - Name:', name, 'Avatar:', avatarImage, 'Bio:', bio);

          if (!name) {
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
          console.error('Parse error:', e.message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Could not parse profile: ' + e.message }));
        }
      });

    }).on('error', (err) => {
      console.error('HTTPS error:', err.message);
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
