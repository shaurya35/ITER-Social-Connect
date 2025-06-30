import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_PATH, 'pingHistory.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

// Initialize file if not exists
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

let pingHistory = [];

// Read from file
try {
  const data = fs.readFileSync(FILE_PATH, 'utf-8');
  pingHistory = JSON.parse(data);
} catch (error) {
  console.error('Error reading ping history:', error);
}

export const addPingRecord = (record) => {
  pingHistory.push(record);
  
  // Keep only the last 100 records
  if (pingHistory.length > 100) {
    pingHistory.shift();
  }
  
  // Write to file
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(pingHistory));
  } catch (error) {
    console.error('Error saving ping history:', error);
  }
};

export const getPingHistory = () => {
  return [...pingHistory].reverse(); // Return reversed to show latest first
};