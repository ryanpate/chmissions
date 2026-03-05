const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'chmissions2026';
const DATA_DIR = process.env.DATA_DIR || '/data';
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
const MANIFEST_PATH = path.join(DATA_DIR, 'photos.json');

// Ensure directories exist
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

// Initialize manifest if it doesn't exist
if (!fs.existsSync(MANIFEST_PATH)) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify({
        collections: [],
        banner: { collectionId: null, photoIndex: null }
    }, null, 2));
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve photos as static files
app.use('/photos', express.static(PHOTOS_DIR));

// Auth middleware for admin routes
function requireAuth(req, res, next) {
    const password = req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Helper: read manifest
function readManifest() {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

// Helper: write manifest
function writeManifest(data) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(data, null, 2));
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, PHOTOS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
        if (allowed.test(path.extname(file.originalname))) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// ===== PUBLIC ROUTES =====

// GET /api/collections - List all collections
app.get('/api/collections', (req, res) => {
    const data = readManifest();
    res.json(data);
});

// GET /api/banner - Get banner config
app.get('/api/banner', (req, res) => {
    const data = readManifest();
    if (data.banner && data.banner.collectionId) {
        const collection = data.collections.find(c => c.id === data.banner.collectionId);
        res.json({ banner: data.banner, collection: collection || null });
    } else {
        res.json({ banner: data.banner, collection: null });
    }
});

// ===== ADMIN ROUTES =====

// POST /api/collections - Create a new collection with photos
app.post('/api/collections', requireAuth, upload.array('photos', 20), (req, res) => {
    try {
        const { title, date, mission, captions } = req.body;

        if (!title) return res.status(400).json({ error: 'Title is required' });
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'At least one photo is required' });

        const captionsArray = captions ? JSON.parse(captions) : [];

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const collectionId = `${date || new Date().toISOString().split('T')[0]}-${slug}`;

        const photos = req.files.map((file, i) => ({
            file: file.filename,
            caption: captionsArray[i] || '',
            originalName: file.originalname
        }));

        const data = readManifest();
        data.collections.push({
            id: collectionId,
            title,
            date: date || new Date().toISOString().split('T')[0],
            mission: mission || null,
            photos
        });

        writeManifest(data);
        res.json({ success: true, collectionId, photoCount: photos.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/collections/:id - Delete a collection
app.delete('/api/collections/:id', requireAuth, (req, res) => {
    try {
        const data = readManifest();
        const collection = data.collections.find(c => c.id === req.params.id);

        if (!collection) return res.status(404).json({ error: 'Collection not found' });

        // Delete photo files
        collection.photos.forEach(photo => {
            const filePath = path.join(PHOTOS_DIR, photo.file);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        // Remove from manifest
        data.collections = data.collections.filter(c => c.id !== req.params.id);

        // Clear banner if it pointed to this collection
        if (data.banner && data.banner.collectionId === req.params.id) {
            data.banner.collectionId = null;
        }

        writeManifest(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/banner - Set banner collection
app.put('/api/banner', requireAuth, (req, res) => {
    try {
        const { collectionId } = req.body;
        const data = readManifest();

        if (collectionId && !data.collections.find(c => c.id === collectionId)) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        data.banner.collectionId = collectionId || null;
        writeManifest(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/collections/:id/photos - Add photos to existing collection
app.post('/api/collections/:id/photos', requireAuth, upload.array('photos', 20), (req, res) => {
    try {
        const { captions } = req.body;
        const captionsArray = captions ? JSON.parse(captions) : [];

        const data = readManifest();
        const collection = data.collections.find(c => c.id === req.params.id);

        if (!collection) return res.status(404).json({ error: 'Collection not found' });

        const newPhotos = req.files.map((file, i) => ({
            file: file.filename,
            caption: captionsArray[i] || '',
            originalName: file.originalname
        }));

        collection.photos.push(...newPhotos);
        writeManifest(data);
        res.json({ success: true, photoCount: newPhotos.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/collections/:id/photos/:filename - Remove a single photo
app.delete('/api/collections/:id/photos/:filename', requireAuth, (req, res) => {
    try {
        const data = readManifest();
        const collection = data.collections.find(c => c.id === req.params.id);

        if (!collection) return res.status(404).json({ error: 'Collection not found' });

        const photoIndex = collection.photos.findIndex(p => p.file === req.params.filename);
        if (photoIndex === -1) return res.status(404).json({ error: 'Photo not found' });

        // Delete file
        const filePath = path.join(PHOTOS_DIR, req.params.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        // Remove from collection
        collection.photos.splice(photoIndex, 1);
        writeManifest(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', collections: readManifest().collections.length });
});

app.listen(PORT, () => {
    console.log(`CH Missions Photos API running on port ${PORT}`);
});
