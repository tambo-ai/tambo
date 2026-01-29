/**
 * Tambo AI Configuration
 * 
 * Configure your Tambo AI client with your API key and settings.
 * Get your API key from: https://tambo.ai/dashboard
 */

import { TamboClient } from '@tambo-ai/typescript-sdk';

// Initialize Tambo AI client
// Replace 'your-api-key-here' with your actual API key
export const tamboClient = new TamboClient({
  apiKey: process.env.EXPO_PUBLIC_TAMBO_API_KEY || 'your-api-key-here',
  // Add additional configuration options here
});

// Default configuration for Tambo AI calls
export const defaultTamboConfig = {
  model: 'gpt-4', // or your preferred model
  temperature: 0.7,
  maxTokens: 1000,
};

export default tamboClient;
