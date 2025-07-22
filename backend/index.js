const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors()); // allow all frontend requests
app.use(express.json()); // support JSON body

app.get('/', (req, res) => {
  res.send('RingZo backend is running 🎶');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
