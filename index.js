const http = require('http');
const https = require('https');
const url = require('url');

const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VRChat Avatar Finder</title>
<style>
body {
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #0f172a, #1e1b4b);
  min-height: 100vh;
  color: white;
  padding: 20px;
  margin: 0;
}
.container {
  max-width: 600px;
  margin: 0 auto;
}
h1 {
  text-align: center;
  color: #22d3ee;
  margin-bottom: 30px;
}
.search {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}
input {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 1em;
}
button {
  padding: 12px 24px;
  background: #a855f7;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
button:disabled {
  opacity: 0.5;
}
.card {
  background: rgba(30, 41, 59, 0.8);
  border: 2px solid #a855f7;
  padding: 20px;
  margin: 20px 0;
  border-radius: 8px;
}
img {
  width: 100%;
  max-width: 300px;
  border-radius: 6px;
  margin: 15px 0;
}
.error {
  background: #ff6b6b;
  padding: 15px;
  border-radius: 6px;
  color: #fff;
}
h2 {
  color: #22d3ee;
  margin-bottom: 10px;
}
h3 {
  color: #22d3ee;
  margin-bottom: 10px;
}
</style>
</head>
<body>
<div class="container">
  <h1>⚡ VRChat Avatar Finder ⚡</h1>
  <div class="search">
    <input type="text" id="user" placeholder="Enter VRChat username...">
    <button onclick="search()">Search</button>
  </div>
  <div id="result"></div>
</div>

<script>
async function search() {
  const username = document.getElementById('user').value;
  if (!username) return;
  
  document.getElementById('result').innerHTML = '<div class="card">Searching...</div>';
  
  try {
    const res = await fetch('/api/user?u=' + encodeURIComponent(username));
    const text = await res.text();
    
    console.log('Response status:', res.status);
    console.log('Response text:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      document.getElementById('result').innerHTML = '<div class="card error">❌ Invalid response from server</div>';
      return;
    }
    
    console.log('Data:', data);
    
    if (!data || !data.username) {
      if (data && data.error) {
        document.getElementById('result').innerHTML = '<div class="card error">❌ ' + data.error + '</div>';
      } else {
        document.getElementById('result').innerHTML = '<div class="card error">❌ User not found. Try: "Demo"</div>';
      }
      return;
    }
    
    let html = '<div class="card">';
    html += '<h2>' + data.displayName + '</h2>';
    html += '<p>@' + data.username + '</p>';
    
    if (data.currentAvatarImageUrl) {
      html += '<img src="' + data.currentAvatarImageUrl + '" alt="avatar">';
    }
    
    html += '</div>';
    
    if (data.currentAvatarId) {
      const av = await fetch('/api/avatar?id=' + encodeURIComponent(data.currentAvatarId));
      if (av.ok) {
        const ad = await av.json();
        html += '<div class="card">';
        html += '<h3>🎨 ' + ad.name + '</h3>';
        html += '<p>By: ' + (ad.authorName || 'Unknown') + '</p>';
        html += '</div>';
      }
    }
    
    document.getElementById('result').innerHTML = html;
  } catch (e) {
    console.error('Error:', e);
    document.getElementById('result').innerHTML = '<div class="card error">❌ Error: ' + e.message + '</div>';
  }
}

document.getElementById('user').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') search();
});
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
  } 
  else if (pathname === '/api/user' && query.u) {
    fetchVRChat(`https://api.vrchat.cloud/api/1/users/${query.u}`, res);
  } 
  else if (pathname === '/api/avatar' && query.id) {
    fetchVRChat(`https://api.vrchat.cloud/api/1/avatars/${query.id}`, res);
  } 
  else {
    res.writeHead(404);
    res.end('Not found');
  }
});

function fetchVRChat(apiUrl, res) {
  https.get(apiUrl, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  }).on('error', (error) => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  });
}

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
