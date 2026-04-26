const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const serveOnly = process.argv.includes('--serve-only');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json',
    '.txt': 'text/plain; charset=utf-8',
};

let buildChild;
if (!serveOnly) {
    buildChild = spawn(process.execPath, [path.join(ROOT, 'build.js'), '--watch'], { stdio: 'inherit' });
    buildChild.on('exit', code => {
        process.exit(code ?? 0);
    });
}

const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        return res.end();
    }

    const { pathname: urlPath } = new URL(req.url, `http://${HOST}:${PORT}`);
    const rel = urlPath === '/' || urlPath === '' ? 'index.html' : urlPath.replace(/^\//, '');
    const abs = path.resolve(ROOT, rel);
    const underRoot = path.relative(ROOT, abs);
    if (underRoot.startsWith('..') || path.isAbsolute(underRoot)) {
        res.writeHead(403);
        return res.end();
    }

    const sendFile = p => {
        const ext = path.extname(p);
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store',
        });
        if (req.method === 'HEAD') {
            return res.end();
        }
        fs.createReadStream(p).on('error', () => {
            if (!res.headersSent) {
                res.writeHead(500);
            }
            res.end();
        }).pipe(res);
    };

    fs.stat(abs, (err, st) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not found');
        }
        if (st.isFile()) {
            return sendFile(abs);
        }
        if (st.isDirectory()) {
            return fs.stat(path.join(abs, 'index.html'), (e2, st2) => {
                if (e2 || !st2 || !st2.isFile()) {
                    res.writeHead(404);
                    return res.end('Not found');
                }
                return sendFile(path.join(abs, 'index.html'));
            });
        }
        res.writeHead(404);
        return res.end('Not found');
    });
});

const shutdown = () => {
    if (buildChild) {
        buildChild.kill('SIGINT');
    }
    server.close(() => process.exit(0));
};

server.listen(PORT, HOST, () => {
    const displayHost = HOST === '0.0.0.0' ? '127.0.0.1' : HOST;
    console.log(
        `\n[serve]  http://${displayHost}:${PORT}  (no cache)${serveOnly ? '' : '  (watching content/)'}\n`,
    );
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
