import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from './config/db';
import departmentRoutes from './routes/departmentRoutes';
import budgetRoutes from './routes/budgetRoutes';
import expenseRoutes from './routes/expenseRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import analysisRoutes from './routes/analysisRoutes';
import forecastRoutes from './routes/forecastRoutes';
import optimizationRoutes from './routes/optimizationRoutes';
import aiRoutes from './routes/aiRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/departments', departmentRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/ai', aiRoutes);

// Basic health-check route
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const stateMap: Record<number, string> = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };
  
  res.json({
    status: 'ok',
    project: 'OptiFi API running',
    database: {
      connected: readyState === 1,
      state: stateMap[readyState] || 'Unknown',
      name: mongoose.connection.name,
    },
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  // Serve frontend static files in production
  if (process.env.NODE_ENV === 'production') {
    const rootPath = path.resolve();
    app.use(express.static(path.join(rootPath, 'dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(rootPath, 'dist', 'index.html'));
    });
  } else {
    // Vite Middleware for development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
