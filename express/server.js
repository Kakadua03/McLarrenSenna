const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Route: Show Csv
app.get('/data', (req, res) => {
    const filePath = path.join(__dirname, 'engines-sample.csv');

    const fs = require('fs');
    const csv = fs.readFileSync(filePath, 'utf8');

    res.type('text/csv').send(csv);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server runs at http://localhost:${PORT}`);
});
