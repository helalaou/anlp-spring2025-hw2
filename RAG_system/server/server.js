import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { runOpenAI } from './openaiModule.js';
import { runOllama } from './ollamaModule.js';
import config from './config.js';

const app = express();
const port = config.server.port;

app.use(cors({
  origin: `http://localhost:${config.client.port}`, // Allow requests from React app
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize chat history
let chatHistory = [];

// Get model information to display to users
const getModelInfo = () => {
  let chatModelInfo;
  let embeddingModelInfo;
  
  if (config.chat.provider === 'openai') {
    chatModelInfo = `OpenAI: ${config.chat.openai.model}`;
  } else {
    chatModelInfo = `Ollama: ${config.chat.ollama.model}`;
  }
  
  if (config.rag.embedding.provider === 'openai') {
    embeddingModelInfo = `OpenAI: ${config.rag.embedding.openai.model}`;
  } else {
    embeddingModelInfo = `Sentence Transformers: ${config.rag.embedding.sentenceTransformers.model}`;
  }
  
  return {
    chatModel: chatModelInfo,
    embeddingModel: embeddingModelInfo,
    numResults: config.rag.data.numResults,
    separator: config.rag.data.separator
  };
};

// Helper function to determine which chat model provider to use
const getChatProvider = async (prompt, context, history) => {
  if (config.chat.provider === 'ollama') {
    console.log('Using Ollama provider for chat');
    return runOllama(prompt, context, history);
  } else {
    console.log('Using OpenAI provider for chat');
    return runOpenAI(prompt, context, history);
  }
};

// Helper function to query the RAG server
const queryRAGServer = async (query) => {
  console.log('Querying RAG server with:', query);
  console.log('RAG API URL:', config.server.faissApiUrl);
  
  // Check if the RAG server is available
  try {
    await axios.get(`${config.server.faissApiUrl}/health`, { timeout: 5000 });
  } catch (error) {
    // Instead of fallback, throw an error to stop processing
    console.error('RAG server health check failed:', error.message);
    throw new Error('RAG server is not available. Make sure the Python server is running.');
  }
  
  // Send the actual query
  const response = await axios.post(`${config.server.faissApiUrl}/query`, {
    query
  }, {
    timeout: 15000 // 15 second timeout for the query operation
  });
  
  // Validate the response
  if (!response.data || !response.data.context) {
    console.error('Invalid response from RAG server:', response.data);
    throw new Error('Received invalid response from RAG server. Please check server logs.');
  }
  
  console.log('RAG response received');
  console.log('Retrieved context length:', response.data.context.length);
  
  // If the context is empty or very short, log a warning
  if (response.data.context.length < 50) {
    console.warn('Warning: Very short or empty context returned from RAG server:');
    console.warn(response.data.context);
  }
  
  return response.data.context;
};

// Helper function to print the full chat history
const printChatHistory = () => {
  if (chatHistory.length === 0) {
    console.log('\n===== CHAT HISTORY IS EMPTY =====\n');
    return;
  }
  
  console.log('\n===== CURRENT CHAT HISTORY =====');
  chatHistory.forEach((msg, index) => {
    const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
    const separator = '-------------------------';
    
    console.log(`\n[${index + 1}] ${role}:`);
    console.log(separator);
    console.log(msg.content);
    console.log(separator);
  });
  console.log('\n==============================\n');
};

// Generate Response Route
app.post('/generate', async (req, res) => {
  try {
    const { text } = req.body;
    console.log('\n===== NEW USER QUERY =====');
    console.log(`Query: "${text}"`);

    // Get context from the RAG server - no fallback, if it fails, the error will propagate
    console.log('Querying RAG server for relevant context...');
    const context = await queryRAGServer(text);
    console.log(`Retrieved context (${context.length} chars)`);
    
    // Log a clear separator for the context
    console.log('\n----- RETRIEVED CONTEXT -----');
    console.log(context);
    console.log('-----------------------------\n');

    // Get response from the configured chat provider
    console.log(`Sending prompt to ${config.chat.provider} with ${context.length} chars of context`);
    console.log(`Current chat history length: ${chatHistory.length} messages`);
    
    const generatedText = await getChatProvider(text, context, chatHistory);
    console.log('\n----- LLM RESPONSE -----');
    console.log(generatedText);
    console.log('------------------------\n');
    
    // Add the interaction to chat history
    chatHistory.push({role: 'user', content: text});
    chatHistory.push({role: 'assistant', content: generatedText});
    
    // Keep chat history at a reasonable size
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(chatHistory.length - 20);
    }
    
    // Print the updated chat history
    printChatHistory();
    
    res.json({ generated_text: generatedText });
  } catch (error) {
    console.error('Error in /generate route:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while generating the response.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Reset chat history
app.post('/reset', (req, res) => {
  console.log('Resetting chat history');
  chatHistory = [];
  
  // Include model information in the log but not in the response
  const modelInfo = getModelInfo();
  console.log('\n===== CHAT RESET - SYSTEM CONFIGURATION =====');
  console.log(`Chat Model: ${modelInfo.chatModel}`);
  console.log(`Embedding Model: ${modelInfo.embeddingModel}`);
  console.log(`Top Results: ${modelInfo.numResults}`);
  console.log(`Document Separator: "${modelInfo.separator}"`);
  console.log('==============================================\n');
  
  // Print empty chat history after reset
  printChatHistory();
  
  res.json({ 
    message: 'Chat history reset successfully'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const modelInfo = getModelInfo();
  
  res.json({ 
    status: 'ok',
    provider: config.chat.provider,
    chatModel: modelInfo.chatModel,
    embeddingProvider: config.rag.embedding.provider,
    embeddingModel: modelInfo.embeddingModel,
    numResults: modelInfo.numResults,
    documentSeparator: modelInfo.separator
  });
});

// Direct RAG query endpoint for testing
app.post('/rag-query', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Received request to query RAG system');
    
    const context = await queryRAGServer(query);
    res.json({ context });
  } catch (error) {
    console.error('Error in /rag-query route:', error);
    res.status(500).json({ 
      error: 'An error occurred while querying the RAG server.',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  const modelInfo = getModelInfo();
  console.log(`Server running on port ${port}`);
  console.log('=== Configuration ===');
  console.log(`Chat: ${modelInfo.chatModel}`);
  console.log(`Embeddings: ${modelInfo.embeddingModel}`);
  console.log(`Top-k Results: ${modelInfo.numResults}`);
  console.log(`Document Separator: "${modelInfo.separator}"`);
  console.log(`RAG API URL: ${config.server.faissApiUrl}`);
  console.log('====================');
});