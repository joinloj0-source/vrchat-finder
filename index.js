const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Home page
  if (pathname === '/') {
    const html = getHTML();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // API endpoint
  if (pathname === '/api' && query.user) {
    const username = query.user;
    https.get('https://api.vrchat.cloud/api/1/users/' + username, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const user = JSON.parse(data);
          let result = { user: user };
          
          if (user.currentAvatarId) {
            https.get('https://api.vrchat.cloud/api/1/avatars/' + user.currentAvatarId, (avRes) => {
              let avData = '';
              avRes.on('data', chunk => avData += chunk);
              avRes.on('end', () => {
                try {
                  result.avatar = JSON.parse(avData);
                } catch (e) {}
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
              });
            }).on('error', () => {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            });
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          }
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
        }
      });
    }).on('error', (err) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

function getHTML() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>VRChat Finder</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial;background:linear-gradient(135deg,#0f172a,#1e1b4b);min-height:100vh;color:white;padding:20px}.container{max-width:600px;margin:0 auto}h1{text-align:center;color:#22d3ee;margin-bottom:30px}input,button{padding:12px;border-radius:6px;font-size:1em}input{flex:1;border:none;margin-right:10px}button{background:#a855f7;color:white;border:none;cursor:pointer;font-weight:bold}.search{display:flex;margin-bottom:30px}.card{background:rgba(30,41,59,0.8);border:2px solid #a855f7;padding:20px;margin:20px 0;border-radius:8px}h2{color:#22d3ee;margin-bottom:10px}img{width:100%;max-width:300px;border-radius:6px;margin:15px 0}.error{background:#ff6b6b;color:white;padding:15px;border-radius:6px}</style></head><body><div class="container"><h1>VRChat Finder</h1><div class="search"><input type="text" id="user" placeholder="Username..."><button onclick="search()">Search</button></div><div id="result"></div></div><script>function search(){const u=document.getElementById("user").value;if(!u)return;document.getElementById("result").innerHTML="Searching...";fetch("/api?user="+encodeURIComponent(u)).then(r=>r.json()).then(d=>{if(d.error){document.getElementById("result").innerHTML="<div class=\"error\">Error: "+d.error+"</div>";return}if(!d.user){document.getElementById("result").innerHTML="<div class=\"error\">Not found</div>";return}let html="<div class=\"card\"><h2>"+d.user.displayName+"</h2><p style=\"color:#a78bfa;\">@"+d.user.username+"</p>";if(d.user.currentAvatarImageUrl)html+="<img src=\""+d.user.currentAvatarImageUrl+"\">";html+="</div>";if(d.avatar){html+="<div class=\"card\"><h2>Avatar</h2><p>"+d.avatar.name+"</p><p>By: "+(d.avatar.authorName||"Unknown")+"</p></div>"}document.getElementById("result").innerHTML=html}).catch(e=>{document.getElementById("result").innerHTML="<div class=\"error\">Error: "+e.message+"</div>"})}document.getElementById("user").addEventListener("keypress",e=>{if(e.key==="Enter")search()})</script></body></html>';
}

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
