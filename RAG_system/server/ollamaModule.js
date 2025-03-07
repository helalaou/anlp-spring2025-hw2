import axios from 'axios';
import config from './config.js';

/**
 * Run the Ollama API with the given prompt, context, and history
 * Ollama doesn't support chat history natively like OpenAI, so we format it manually
 */
export async function runOllama(prompt, context, history, timeout = config.chat.timeout) {
  // Format chat history as a string since Ollama doesn't have native chat history support
  const historyString = history.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
  
  // Format the prompt for Ollama with system prompt, history, query and context
  const formattedPrompt = 
  `SYSTEM PROMPT:
   ${config.chat.systemPrompt}\n
   ---------------------------
   CHAT HISTORY:
   ${historyString}
   ---------------------------
   USER QUESTION:
   ${prompt}\n
   ---------------------------
   RETRIEVED DOCUMENTS:
   ${context}\n
   ---------------------------
   Your answer:`;
   
  try {
    console.log('Starting Ollama request');
    console.log('Prompt length:', formattedPrompt.length, 'characters');
    console.log('Context length:', context.length, 'characters');
    
    // Print the full formatted prompt for debugging
    console.log('\n===== FULL OLLAMA PROMPT =====');
    console.log(formattedPrompt);
    console.log('\n==============================\n');
    
    // Create a cancel token for timeout
    const source = axios.CancelToken.source();
    const timeoutId = setTimeout(() => {
      source.cancel('Request timeout');
    }, timeout);
    
    try {
      const response = await axios.post(
        config.chat.ollama.apiUrl + '/generate',
        {
          model: config.chat.ollama.model,
          prompt: formattedPrompt,
          stream: false,
          options: {
            temperature: 0.7
          }
        },
        { 
          timeout: timeout,
          cancelToken: source.token
        }
      );
      
      clearTimeout(timeoutId);
      console.log('Ollama response received successfully');
      return response.data.response.trim();
    } catch (axiosError) {
      clearTimeout(timeoutId);
      if (axios.isCancel(axiosError)) {
        throw new Error('Ollama request timed out. Please try again.');
      }
      throw axiosError;
    }
  } catch (error) {
    console.error('Error in runOllama:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
    }
    throw new Error(`Ollama error: ${error.message}`);
  }
} 