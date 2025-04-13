import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { fileURLToPath } from 'url';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Python script
const pythonScript = path.join(__dirname, '../../stock_tracker.py');

// Initialize the stock tracker
export function initializeStockTracker(): void {
  // Copy the python script to the root directory
  const sourceScript = path.join(__dirname, '../../attached_assets/stock_tracker.py');
  
  if (fs.existsSync(sourceScript)) {
    fs.copyFileSync(sourceScript, path.join(__dirname, '../../stock_tracker.py'));
    console.log('Stock tracker script initialized');
  } else {
    console.error('Source stock tracker script not found');
  }
  
  // Create stock tracker Flask server entry point
  const indexHtmlSource = path.join(__dirname, '../../attached_assets/index.html');
  const templatesDir = path.join(__dirname, '../../templates');
  
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  if (fs.existsSync(indexHtmlSource)) {
    fs.copyFileSync(indexHtmlSource, path.join(templatesDir, 'index.html'));
    console.log('Stock tracker index.html initialized');
  } else {
    console.error('Source index.html not found');
  }
}

// Run the Python stock tracker in the background
let stockTrackerProcess: any = null;

export function startStockTracker(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (stockTrackerProcess) {
      return resolve();
    }
    
    console.log('Starting stock tracker service...');
    
    // Get the current working directory
    const cwd = process.cwd();
    
    // Run the Python script
    stockTrackerProcess = exec(`python3 ${path.join(cwd, 'stock_tracker.py')}`, 
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Stock tracker error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Stock tracker stderr: ${stderr}`);
          return;
        }
        console.log(`Stock tracker stdout: ${stdout}`);
      }
    );
    
    // Give the server a moment to start
    setTimeout(() => {
      console.log('Stock tracker service started');
      resolve();
    }, 2000);
  });
}

// API route handlers
export async function buyStock(req: Request, res: Response) {
  try {
    const { symbol, shares } = req.body;
    
    // Make a fetch request to the Python Flask server
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:5000/buy_stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, shares }),
    });
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error buying stock:', error);
    res.status(500).json({ success: false, error: 'Failed to buy stock' });
  }
}

export async function getPortfolio(req: Request, res: Response) {
  try {
    // Make a fetch request to the Python Flask server
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:5000/portfolio');
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
}

export async function getRoi(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    
    // Make a fetch request to the Python Flask server
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`http://localhost:5000/roi/${symbol}`);
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error getting ROI:', error);
    res.status(500).json({ error: 'Failed to get ROI' });
  }
}