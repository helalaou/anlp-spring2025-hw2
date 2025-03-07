import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory name of the current module (works in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let config;
try {
  // The config should be in the same directory as this file
  const configPath = path.join(__dirname, 'config.json');
  
  console.log(`Looking for config at: ${configPath}`);
  
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found at ${configPath}`);
    console.error('Trying alternate path in current working directory...');
    
    // Fallback to current working directory
    const cwdConfigPath = path.join(process.cwd(), 'server', 'config.json');
    
    if (fs.existsSync(cwdConfigPath)) {
      console.log(`Found config at fallback location: ${cwdConfigPath}`);
      const configData = fs.readFileSync(cwdConfigPath, 'utf8');
      config = JSON.parse(configData);
    } else {
      throw new Error('Config file not found in any location');
    }
  } else {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log('Successfully loaded configuration');
  }
} catch (error) {
  console.error('Error loading config.json:', error.message);
  throw new Error('Failed to load configuration. Make sure config.json exists.');
}

// Add the OpenAI API key from environment variables
config.chat.openai.apiKey = process.env.OPENAI_API_KEY;

// Fall back to Ollama if OpenAI is selected but no API key is provided
if (config.chat.provider === 'openai' && !config.chat.openai.apiKey) {
  console.warn('Warning: OpenAI provider selected but no API key provided in the .env file.');
  console.warn('Switching to Ollama provider. To use OpenAI, please add your API key to the .env file.');
  config.chat.provider = 'ollama';
}

export default config;
