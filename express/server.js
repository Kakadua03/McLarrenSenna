const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Route: Show Csv
app.get('/data', (req, res) => {
    const filePath = path.join(__dirname, 'data.csv');
    res.sendFile(filePath);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server runs at http://localhost:${PORT}`);
});