const express = require('express');
const cors = require('cors');
const scdl = require('soundcloud-downloader');
const app = express();
const PORT = 3000;

app.use(cors({ exposedHeaders: ['Content-Disposition'] }));
app.use(express.json());

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // The getInfo function will throw an error if the URL is invalid, acting as our validation.
        const trackInfo = await scdl.default.getInfo(url);
        const sanitizedTitle = trackInfo.title.replace(/[^a-zA-Z0-9\s]/g, ''); // Sanitize title for filename
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        const stream = await scdl.default.download(url);
        stream.pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download track.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
