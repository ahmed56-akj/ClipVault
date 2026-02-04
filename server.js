const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- API ROUTE TO GET MEDIA ---
app.get('/api/extract', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        // 1. YouTube Logic (With Safety Check)
        const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^"&?\/\s]{11})/;
        const ytMatch = url.match(ytRegex);

        if (ytMatch) {
            const videoId = ytMatch[1];
            return res.json({
                success: true,
                platform: "YouTube",
                title: "YouTube Video Thumbnail",
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                high: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                low: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            });
        }

        // 2. Generic Social Media Scraping (Instagram/TikTok/Others)
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 8000 // 8 seconds timeout taaki hosting crash na ho
        });

        const $ = cheerio.load(response.data);
        
        // Meta tags extraction
        const thumbnail = $('meta[property="og:image"]').attr('content') || 
                          $('meta[name="twitter:image"]').attr('content') ||
                          $('link[rel="image_src"]').attr('href');

        if (thumbnail) {
            return res.json({
                success: true,
                platform: "Social Media",
                title: "Media Preview Found",
                thumbnail: thumbnail,
                high: thumbnail,
                low: thumbnail
            });
        }

        return res.status(404).json({ error: "No preview found. This link might be private or protected." });

    } catch (error) {
        console.error("Error fetching URL:", error.message);
        return res.status(500).json({ 
            error: "Server error or URL not accessible",
            details: error.message 
        });
    }
});

// Important for Hosting (Render, Heroku, etc.)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Backend is running on port ${PORT}`);
});
