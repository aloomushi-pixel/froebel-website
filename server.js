import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(compression());
app.use(express.static(__dirname, {
    setHeaders: (res, reqPath) => {
        if (reqPath.endsWith('.html') || reqPath.endsWith('.css') || reqPath.endsWith('.js')) {
            // Never cache HTML, CSS, or JS (we don't use file hashes)
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
            // Cache images, fonts, etc. for 1 year
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

app.listen(3000, () => console.log('Optimized Server running on port 3000'));
