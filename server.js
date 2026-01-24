const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Aapki HTML file 'public' folder mein honi chahiye

// --- API ROUTE TO GET MEDIA ---
app.get('/api/extract', async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        // 1. YouTube Logic
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^"&?\/\s]{11})/)[1];
            return res.json({
                platform: "YouTube",
                title: "YouTube Video Thumbnail",
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                high: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                low: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            });
        }

        // 2. Instagram/TikTok Scraping Logic
        // Hum link par request bhejte hain aur HTML se 'meta tags' nikalte hain
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        const $ = cheerio.load(response.data);
        
        // Open Graph Image (og:image) nikalna jo aksar thumbnail hota hai
        const thumbnail = $('meta[property="og:image"]').attr('content') || 
                          $('meta[name="twitter:image"]').attr('content');

        if (thumbnail) {
            return res.json({
                platform: "Social Media",
                title: "Media Cover Found",
                thumbnail: thumbnail,
                high: thumbnail,
                low: thumbnail
            });
        }

        res.status(404).json({ error: "Could not extract thumbnail from this link." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error or Invalid URL" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));