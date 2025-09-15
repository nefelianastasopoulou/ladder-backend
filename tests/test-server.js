const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test server accessible at http://localhost:${PORT}`);
});

// Add error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

