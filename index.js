const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>VRChat Avatar Finder</title>
  <style>
    body { 
      font-family: Arial; 
      background: #1a1a2e; 
      color: white; 
      padding: 20px; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
    }
    h1 { 
      color: #00d4ff; 
      text-align: center; 
    }
    .info {
      background: #16213e;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      border-left: 4px solid #a855f7;
      color: #a78bfa;
      font-size: 0.9em;
    }
    input { 
      width: 90%; 
      padding: 12px; 
      margin: 10px 0; 
      border: none; 
      border-radius: 5px; 
      font-size: 1em; 
    }
    button { 
      padding: 12px 20px; 
      background: #a855f7; 
      color: white; 
      border: none; 
      border-radius: 5px; 
      cursor: pointer; 
      font-weight: bold; 
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
      color: white; 
      padding: 15px; 
      border-radius: 5px; 
      margin: 20px 0; 
    }
    img { 
      width: 100%; 
      max-width: 250px; 
      border-radius: 5px; 
      margin: 15px 0; 
    }
    h2 { 
      color: #00d4ff; 
      margin-bottom: 10px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ VRChat Avatar Finder</h1>
    
    <div class="info">
      ℹ️ Make sure you're <strong>logged into VRChat.com</strong> in another tab for this to work!
    </div>
    
    <p style="text-align: center; color: #a78bfa;">Search any VRChat username</p>
    
    <input type="text" id="username" placeholder="Enter VRChat username..." />
    <button onclick="search()">Search</button>
    
    <div id="output"></div>
  </div>

  <script>
    async function search() {
      const username = document.getElementById('username').value.trim();
      
      if (!username) {
        document.getElementById('output').innerHTML = '<div class="error">Please enter a username</div>';
        return;
      }

      document.getElementById('output').innerHTML = '<div class="result">Searching for "' + username + '"...</div>';
      
      try {
        // Fetch VRChat profile directly from browser (with your login cookies)
        const response = await fetch('https://www.vrchat.com/user/' + username, {
          credentials: 'include', // Include your VRChat session cookies
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          document.getElementById('output').innerHTML = '<div class="error">❌ User not found or profile is private</div>';
          return;
        }

        const html = await response.text();
        console.log('Got response, length:', html.length);

        // Parse the HTML
        let name = null;
        let avatarImage = null;
        let bio = null;

        // Extract display name
        const nameMatch = html.match(/"displayName"\s*:\s*"([^"]+)"/);
        if (nameMatch) name = nameMatch[1];

        // Extract avatar image
        const avatarMatch = html.match(/"currentAvatarImageUrl"\s*:\s*"([^"]+)"/);
        if (avatarMatch) avatarImage = avatarMatch[1];

        // Extract bio
        const bioMatch = html.match(/"bio"\s*:\s*"([^"]+)"/);
        if (bioMatch) bio = bioMatch[1];

        console.log('Parsed:', { name, avatarImage, bio });

        if (!name) {
          document.getElementById('output').innerHTML = '<div class="error">❌ Could not find user data. Make sure you\\'re logged into VRChat!</div>';
          return;
        }

        let html2 = '<div class="result">';
        html2 += '<h2>' + name + '</h2>';
        html2 += '<p style="color: #a78bfa;">@' + username + '</p>';
        
        if (avatarImage) {
          html2 += '<img src="' + avatarImage + '" alt="Avatar">';
        }
        
        if (bio) {
          html2 += '<p style="margin-top: 15px; color: #c084fc; font-style: italic;">' + bio + '</p>';
        }
        
        html2 += '<p style="margin-top: 15px;"><a href="https://www.vrchat.com/user/' + username + '" target="_blank" style="color: #00d4ff;">View Full Profile →</a></p>';
        html2 += '</div>';
        
        document.getElementById('output').innerHTML = html2;

      } catch (error) {
        console.error('Error:', error);
        document.getElementById('output').innerHTML = '<div class="error">❌ Error: ' + error.message + '<br><br>Make sure you\\'re logged into VRChat.com!</div>';
      }
    }

    document.getElementById('username').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') search();
    });
  </script>
</body>
</html>`);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => {
  console.log('VRChat Avatar Finder running on port 3000');
});
