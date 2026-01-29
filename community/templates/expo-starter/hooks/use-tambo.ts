/**
 * Tambo AI React Hooks
 * 
 * Custom hooks for integrating Tambo AI into your React Native components.
 * These hooks provide a clean, reusable way to interact with Tambo AI.
 */

import { defaultTamboConfig, tamboClient } from '@/lib/tambo-config';
import { useCallback, useState } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseTamboOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Hook for handling Tambo AI chat completions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sendMessage, messages, isLoading, error } = useTamboChat({
 *     systemPrompt: 'You are a helpful assistant.'
 *   });
 *   
 *   const handleSend = async () => {
 *     await sendMessage('Hello!');
 *   };
 * }
 * ```
 */
export function useTamboChat(options: UseTamboOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    model = defaultTamboConfig.model,
    temperature = defaultTamboConfig.temperature,
    maxTokens = defaultTamboConfig.maxTokens,
    systemPrompt,
  } = options;

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true);
      setError(null);

      const userMessage: Message = { role: 'user', content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      try {
        const apiMessages = systemPrompt
          ? [{ role: 'system' as const, content: systemPrompt }, ...updatedMessages]
          : updatedMessages;

        const response = await tamboClient.chat.completions.create({
          messages: apiMessages,
          model,
          temperature,
          max_tokens: maxTokens,
        });

        const assistantMessage: Message = {
          role: 'assistant',
          content: response.choices[0]?.message?.content || 'No response',
        };

        setMessages([...updatedMessages, assistantMessage]);
        return assistantMessage;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, model, temperature, maxTokens, systemPrompt]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearMessages,
  };
}

/**
 * Hook for single completion requests
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { complete, isLoading, result } = useTamboCompletion();
 *   
 *   const handleGenerate = async () => {
 *     const response = await complete('Write a haiku about coding');
 *     console.log(response);
 *   };
 * }
 * ```
 */
export function useTamboCompletion(options: UseTamboOptions = {}) {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    model = defaultTamboConfig.model,
    temperature = defaultTamboConfig.temperature,
    maxTokens = defaultTamboConfig.maxTokens,
  } = options;

  const complete = useCallback(
    async (prompt: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await tamboClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          temperature,
          max_tokens: maxTokens,
        });

        const content = response.choices[0]?.message?.content || '';
        setResult(content);
        return content;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [model, temperature, maxTokens]
  );

  return {
    complete,
    result,
    isLoading,
    error,
  };
}

/**
 * Hook for streaming completions
 * Note: Adjust based on Tambo AI's actual streaming API
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { stream, isStreaming, chunks } = useTamboStream();
 *   
 *   const handleStream = async () => {
 *     await stream('Tell me a story');
 *   };
 * }
 * ```
 */
export function useTamboStream(options: UseTamboOptions = {}) {
  const [chunks, setChunks] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    model = defaultTamboConfig.model,
    temperature = defaultTamboConfig.temperature,
    maxTokens = defaultTamboConfig.maxTokens,
  } = options;

  const stream = useCallback(
    async (prompt: string) => {
      setIsStreaming(true);
      setError(null);
      setChunks([]);

      try {
        // Adjust this based on Tambo AI's actual streaming implementation
        const response = await tamboClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        });

        // Handle streaming response
        if (response && typeof response === 'object' && 'on' in response) {
          (response as any).on('data', (chunk: any) => {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              setChunks((prev) => [...prev, content]);
            }
          });

          (response as any).on('end', () => {
            setIsStreaming(false);
          });
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setIsStreaming(false);
        throw error;
      }
    },
    [model, temperature, maxTokens]
  );

  const fullContent = chunks.join('');

  return {
    stream,
    chunks,
    fullContent,
    isStreaming,
    error,
  };
}
