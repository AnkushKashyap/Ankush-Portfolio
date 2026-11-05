const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Explicit favicon route with no-cache to override Chrome's persistent icon cache
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
