import axios from 'axios';
import config from './config.js';
import OpenAI from 'openai';

// Initialize OpenAI client with error handling
let openai;
try {
  if (!config.chat.openai.apiKey) {
    throw new Error('OPENAI_API_KEY is not set in the .env file');
  }
  
  openai = new OpenAI({
    apiKey: config.chat.openai.apiKey,
  });
  console.log('OpenAI client initialized successfully');
} catch (error) {
  console.error('Error initializing OpenAI client:', error.message);
  console.error('Please make sure you have set the OPENAI_API_KEY in your .env file');
  console.error('If you want to use Ollama instead, set chat.provider="ollama" in config.js');
}

/**
 * Run the OpenAI chat completion API with the given prompt, context, and history
 * OpenAI API has native handling of message history, so we format it accordingly
 */
export async function runOpenAI(prompt, context, history, timeout = config.chat.timeout) {
  try {
    // Check if OpenAI client is properly initialized
    if (!openai) {
      throw new Error('OpenAI client is not initialized. Please check your API key in the .env file.');
    }
    
    console.log('Preparing OpenAI request');
    console.log(`Using model: ${config.chat.openai.model}`);
    console.log(`Context length: ${context.length} characters`);
    console.log(`History length: ${history.length} messages`);
    
    // Format chat history into OpenAI messages format
    const messages = [];
    
    // Add system message with context
    const systemMessage = `${config.chat.systemPrompt}\n\nCONTEXT:\n${context}`;
    messages.push({
      role: 'system',
      content: systemMessage
    });
    
    console.log('System message with context length:', systemMessage.length, 'characters');
    
    // Add chat history - OpenAI API natively supports message history
    if (history && history.length > 0) {
      history.forEach(msg => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });
    }
    
    // Add current user prompt
    messages.push({
      role: 'user',
      content: prompt
    });
    
    console.log(`Total of ${messages.length} messages in the request`);
    
    // Print full request in a clean format for debugging
    console.log('\n===== FULL OPENAI REQUEST =====');
    messages.forEach((msg, index) => {
      console.log(`\n[${index}] ${msg.role.toUpperCase()}:`);
      console.log('-------------------------');
      console.log(msg.content);
      console.log('-------------------------');
    });
    console.log('\n==============================\n');
    
    // Call OpenAI API with a timeout
    console.log('Sending request to OpenAI...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await openai.chat.completions.create({
        model: config.chat.openai.model,
        messages: messages,
        temperature: 0.7,
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      console.log('OpenAI response received successfully');
      return response.choices[0].message.content.trim();
    } catch (apiError) {
      clearTimeout(timeoutId);
      
      if (apiError.name === 'AbortError') {
        throw new Error('OpenAI request timed out. Please try again.');
      }
      
      // For API errors, preserve the OpenAI error message
      throw apiError;
    }
  } catch (error) {
    console.error('Error in runOpenAI:', error.message);
    
    if (error.response) {
      console.error('OpenAI API error details:');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key issue: Please check your .env file and make sure OPENAI_API_KEY is set correctly.');
    }
    
    throw new Error(`OpenAI error: ${error.message}`);
  }
}

/**
 * Creates embeddings using OpenAI's embedding API
 * Supports both single texts and batches
 */
export async function createEmbedding(text) {
  try {
    if (!openai) {
      throw new Error('OpenAI client is not initialized. Please check your API key in the .env file.');
    }
    
    // If the input is an array, process each item
    const isArray = Array.isArray(text);
    const inputText = isArray ? text : [text];
    
    const response = await openai.embeddings.create({
      model: config.chat.openai.embeddingModel,
      input: inputText,
      encoding_format: "float",
    });
    
    const embeddings = response.data.map(item => item.embedding);
    return isArray ? embeddings : embeddings[0];
  } catch (error) {
    console.error('Error creating embedding:', error.message);
    throw error;
  }
} 