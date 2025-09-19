const express = require('express');
const cors = require('cors');
const scdl = require('soundcloud-downloader');
const NodeID3 = require('node-id3');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors({ exposedHeaders: ['Content-Disposition'] }));
app.use(express.json());

// Helper function to download a stream to a buffer
function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log('Fetching track info...');
        const trackInfo = await scdl.default.getInfo(url);

        // Get high-resolution artwork url
        const artworkUrl = trackInfo.artwork_url.replace('-large.jpg', '-t500x500.jpg');
        
        console.log('Downloading audio and artwork...');
        const [audioStream, artworkResponse] = await Promise.all([
            scdl.default.download(url),
            axios.get(artworkUrl, { responseType: 'arraybuffer' })
        ]);

        console.log('Buffering audio...');
        const audioBuffer = await streamToBuffer(audioStream);
        const artworkBuffer = artworkResponse.data;

        const tags = {
            title: trackInfo.title,
            artist: trackInfo.user.username,
            album: trackInfo.genre,
            APIC: artworkBuffer
        };

        console.log('Writing ID3 tags...');
        const taggedAudioBuffer = NodeID3.write(tags, audioBuffer);

        const sanitizedTitle = trackInfo.title.replace(/[^a-zA-Z0-9\s]/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        console.log('Sending file to user.');
        res.send(taggedAudioBuffer);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download or tag track.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
