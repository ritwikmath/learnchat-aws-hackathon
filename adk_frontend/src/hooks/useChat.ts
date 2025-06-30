/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from 'react';
import { useAPI } from './useAPI';

// Define the structure of a message
export interface Message {
  owner: 'user' | 'system';
  text: string;
}

// Define the structure of the API response for a single item
interface ApiResponseItem {
  author: string;
  content: any;
  // Add other potential properties here if known
  [key: string]: any;
}

export function useChat(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { loading, error, response, callAPI } = useAPI<ApiResponseItem[]>();

  const sendMessage = useCallback(async (newMessageText: string, sessionId: string) => {
    if (!newMessageText.trim() || !sessionId) return;

    // Add user message to the chat
    const userMessage: Message = { owner: 'user', text: newMessageText };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Prepare and make the API call
    await callAPI({
      url: `${backendUrl}/run`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        appName: 'git_agent',
        userId: localStorage.getItem("username"), // Placeholder user id
        sessionId: sessionId,
        newMessage: {
          role: 'user',
          parts: [{ text: newMessageText }],
        },
      },
    });
  }, [callAPI]);

  // Handle the API response
  useEffect(() => {
    if (response) {
      const systemResponse = response.find(
        (item) => item?.actions?.stateDelta?.final_output
      );

      if (systemResponse && systemResponse.actions?.stateDelta?.final_output) {
        const systemMessage: Message = {
          owner: 'system',
          text: systemResponse.actions?.stateDelta?.final_output,
        };
        setMessages(prevMessages => [...prevMessages, systemMessage]);
      }
    }
  }, [response]);

  return { setMessages, messages, loading, error, sendMessage };
}
