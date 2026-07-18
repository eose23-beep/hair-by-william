import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables (useful if run as a standalone Node script)
dotenv.config();

// Initialize SDKs
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// DeepSeek or local Ollama use OpenAI-compatible clients
const tier2Client = new OpenAI({
  baseURL: process.env.TIER2_BASE_URL || 'http://localhost:11434/v1', // Default to local Ollama
  apiKey: process.env.TIER2_API_KEY || 'ollama', // Ollama doesn't require a real key
});

/**
 * Utility to minimize context bloat for execution tasks.
 * Keeps only the system prompt and the most recent N messages.
 */
function optimizeContext(messages, maxRecent = 3) {
  if (!messages || messages.length <= maxRecent) return messages || [];
  
  const systemMessages = messages.filter(m => m.role === 'system');
  const chatHistory = messages.filter(m => m.role !== 'system');
  
  // Truncate older chat history, keeping only the most recent context
  const recentHistory = chatHistory.slice(-maxRecent);
  
  return [...systemMessages, ...recentHistory];
}

/**
 * Master Routing Module
 * 
 * @param {string} taskTier - 'planning' (Tier 1) or 'execution' (Tier 2)
 * @param {Array} messages - The conversational context
 * @param {Object} options - Model overrides and temperature settings
 */
export async function routeTask(taskTier, messages, options = {}) {
  try {
    if (taskTier === 'planning' || taskTier === 'architecture') {
      // TIER 1: Anthropic Claude (High-Intelligence, Full Context)
      console.log(`[ROUTER] Routing to Tier 1 (Anthropic) for complex task...`);
      const response = await anthropic.messages.create({
        model: options.model || 'claude-3-5-sonnet-latest',
        max_tokens: options.maxTokens || 4096,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.filter(m => m.role === 'system').map(m => m.content).join('\n'), // Anthropic handles system separately
        temperature: options.temperature || 0.2,
      });
      return response.content[0].text;

    } else if (taskTier === 'execution' || taskTier === 'formatting') {
      // TIER 2: DeepSeek / Ollama (Low-Cost, Optimized Context)
      console.log(`[ROUTER] Routing to Tier 2 (Ollama/DeepSeek) for execution...`);
      
      // Enforce context optimization guardrail
      const optimizedMessages = optimizeContext(messages, 3);
      
      const response = await tier2Client.chat.completions.create({
        model: options.model || 'deepseek-coder', // or llama3
        messages: optimizedMessages,
        temperature: options.temperature || 0.1,
      });
      return response.choices[0].message.content;
      
    } else if (taskTier === 'math' || taskTier === 'reasoning') {
      // TIER 3: OpenAI o1 (The New Math / Reasoning)
      console.log(`[ROUTER] Routing to Tier 3 (OpenAI o1) for math/reasoning...`);
      
      const o1Client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // o1 models currently do not support system prompts well, converting them to user prompts
      const formattedMessages = messages.map(m => 
        m.role === 'system' ? { role: 'user', content: m.content } : m
      );

      const response = await o1Client.chat.completions.create({
        model: options.model || 'o1-mini',
        messages: formattedMessages
        // Note: o1 models do not support temperature parameters
      });
      return response.choices[0].message.content;

    } else {
      throw new Error(`Invalid task tier specified: ${taskTier}. Use 'planning', 'execution', or 'math'.`);
    }
  } catch (error) {
    console.error('[ROUTER] Delegation failed:', error.message);
    throw error;
  }
}
