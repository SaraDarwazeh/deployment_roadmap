// تشغيل: انسخي .env.example لـ .env وحطي مفتاحك، بعدين: node server.js
// بقدم الصفحة من scratchpad/ وبمرر أسئلة غانم لـ Anthropic بالمفتاح تبع السيرفر —
// المفتاح ما بيوصل للمتصفح أبداً.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'scratchpad');
const PORT = process.env.PORT || 3000;

let KEY = process.env.ANTHROPIC_API_KEY || '';
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) KEY = m[1].replace(/^["']|["']$/g, '');
  }
} catch (e) {}

const SYS = 'إنت «غانم»، حارس صفحة اسمها «نو ريسك نو فن» — دليل خفيف دم بيعلّم صاحبتنا (بنت جامعية فلسطينية، بتعرف تبرمج ومشاريعها شغالة على localhost، بس جديدة على عالم النشر) أساسيات الـ deploy: hosting، VPS، لينكس والتيرمنال، SSH، git، deploy.sh، firewall والـ ports، DNS، Cloudflare، وNginx.\n\nأسلوبك:\n- احكي باللهجة الفلسطينية وبصيغة المؤنث.\n- خفيف دم ومختصر — جوابك من سطرين لخمس سطور بالكثير. ممنوع المحاضرات.\n- استخدم تشبيهات من الحياة (البواب، دفتر التلفونات، الباص...) زي ما بتعمل الصفحة.\n- إذا في أمر terminal بالجواب، حطه بسطر لحاله.\n- إذا سألتك عن إشي بعيد عن الموضوع، جاوب بخفة دم بسطر ورجعها عالموضوع.\n- إذا الموضوع كبير، اعطيها الزبدة واقترحي عليها تدور فيديو أو resource.\n- إيموجي وحدة أو ثنتين بالكثير، ولا تبالغ بالحماس.';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function ghanem(req, res) {
  if (!KEY) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end('{"error":"no-key"}');
  }
  let body = '';
  req.on('data', c => {
    body += c;
    if (body.length > 60000) req.destroy();
  });
  req.on('end', async () => {
    try {
      const messages = JSON.parse(body).messages;
      const ok = Array.isArray(messages) && messages.length > 0 && messages.length <= 14 &&
        messages.every(m => (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' && m.content.length <= 4000);
      if (!ok) throw new Error('bad');
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 700, system: SYS, messages })
      });
      const j = await r.text();
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(j);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end('{"error":"bad-request"}');
    }
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/ghanem') return ghanem(req, res);
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, path.normalize(p));
  if (!f.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(f, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('مش موجود 🤷‍♀️');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('نو ريسك نو فن شغال على http://localhost:' + PORT +
    (KEY ? ' — غانم جاهز 🔐' : ' — بدون مفتاح، غانم نايم 🗝️ (حطي ANTHROPIC_API_KEY بملف .env)'));
});
