import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(compression());
app.use(express.static(__dirname, {
    maxAge: '1y',
    setHeaders: (res, reqPath) => {
        if (reqPath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

app.listen(3000, () => console.log('Optimized Server running on port 3000'));
