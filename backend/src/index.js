import express from 'express';
import cors from 'cors';
import pesticidesRouter from './routes/pesticides.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Pesticide routes
app.use('/api/pesticides', pesticidesRouter);

app.listen(PORT, () => {
  console.log(`EPA Label Viewer backend running on http://localhost:${PORT}`);
});
