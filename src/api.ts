const API_KEY = import.meta.env.VITE_4EVERLAND_API_KEY || 'f0750ba86ebae58e583d0536ebc22d41';
const BASE_URL = 'https://ai.api.4everland.org/api/v1/chat/completions';

export const MODELS = [
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6' },
  { id: 'z-ai/glm-5-turbo', name: 'GLM 5 Turbo' },
  { id: 'x-ai/grok-4.20-multi-agent-beta', name: 'Grok 4.20 Beta' }
];

export type Attachment = {
  id: string;
  type: 'image' | 'text';
  data: string;
  name: string;
};

export type AppMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  isStreaming?: boolean;
};

export async function browseUrl(url: string): Promise<string> {
  try {
    const response = await fetch('/api/browse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to browse URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return `Title: ${data.title}\n\nContent:\n${data.content}\n\nLinks found on page:\n${data.links.map((l: any) => `- [${l.text}](${l.href})`).join('\n')}`;
  } catch (error) {
    console.error("Browse URL failed:", error);
    return `Failed to browse URL: ${url}. Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function performWebSearch(query: string): Promise<string> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch('/api/browse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: searchUrl })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter out some noise from DuckDuckGo HTML page
    const cleanLinks = data.links
      .filter((l: any) => !l.href.includes('duckduckgo.com') && !l.href.startsWith('//'))
      .map((l: any) => `- [${l.text}](${l.href})`)
      .join('\n');

    return `Search Results for "${query}":\n\nContent:\n${data.content}\n\nSources:\n${cleanLinks}`;
  } catch (error) {
    console.error("Web search failed:", error);
    return "Web search failed. Please try again or continue without web search.";
  }
}

export async function handleFileUpload(file: File): Promise<{ type: 'image' | 'text', data: string, name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type.startsWith('image/')) {
        resolve({ type: 'image', data: result, name: file.name });
      } else {
        resolve({ type: 'text', data: result, name: file.name });
      }
    };
    reader.onerror = reject;
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

async function* processOpenAIStream(apiMessages: any[], model: string, tools?: any[], signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
  const body: any = {
    model,
    messages: apiMessages,
    stream: true
  };
  
  if (tools) {
    body.tools = tools;
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (!reader) return;

  let buffer = '';
  let toolCalls: any[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      if (line.trim() === 'data: [DONE]') break;
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.choices && data.choices[0]?.delta) {
            const delta = data.choices[0].delta;
            
            if (delta.content) {
              const filteredContent = delta.content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/\*Browsing.*?\*/g, '');
              yield filteredContent;
            }
            
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!toolCalls[tc.index]) {
                  toolCalls[tc.index] = {
                    id: tc.id,
                    type: 'function',
                    function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' }
                  };
                } else {
                  if (tc.function?.arguments) {
                    toolCalls[tc.index].function.arguments += tc.function.arguments;
                  }
                }
              }
            }
          }
        } catch (e) {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }

  if (toolCalls.length > 0) {
    toolCalls = toolCalls.filter(Boolean);
    
    apiMessages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCalls
    });

    for (const tc of toolCalls) {
      if (tc.function.name === 'browseUrl') {
        try {
          const args = JSON.parse(tc.function.arguments);
          const browseResult = await browseUrl(args.url);
          apiMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function.name,
            content: browseResult
          });
        } catch (e) {
          apiMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function.name,
            content: `Error executing tool: ${e instanceof Error ? e.message : String(e)}`
          });
        }
      }
    }

    yield* processOpenAIStream(apiMessages, model, tools, signal);
  }
}

export async function* streamChat(messages: AppMessage[], model: string, webSearch: boolean, liveBrowser: boolean = false, signal?: AbortSignal) {
  const apiMessages = messages.map(m => {
    if (m.attachments && m.attachments.length > 0) {
      const contentParts: any[] = [];
      if (m.content) {
        contentParts.push({ type: 'text', text: m.content });
      }
      m.attachments.forEach(att => {
        if (att.type === 'image') {
          contentParts.push({ type: 'image_url', image_url: { url: att.data } });
        } else if (att.type === 'text') {
          contentParts.push({ type: 'text', text: `\n\nFile: ${att.name}\n\`\`\`\n${att.data}\n\`\`\`\n` });
        }
      });
      return { role: m.role, content: contentParts };
    }
    return { role: m.role, content: m.content };
  });

  if (webSearch) {
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
    if (lastUserMessage && lastUserMessage.content) {
      const searchResults = await performWebSearch(lastUserMessage.content);
      apiMessages.unshift({
        role: 'system',
        content: `You have access to web search results for the user's latest query. Use this information to answer accurately.\n\nWeb Search Results:\n${searchResults}`
      });
    } else {
      apiMessages.unshift({
        role: 'system',
        content: 'You have access to web search. Please provide up-to-date information by searching the web if necessary.'
      });
    }
  }

  let tools: any[] | undefined = undefined;
  
  if (liveBrowser) {
    apiMessages.unshift({
      role: 'system',
      content: 'You are an AI assistant with access to a live web browser. You can read specific URLs to gather information. Always provide accurate, up-to-date information by browsing the web when necessary. If a user asks you to read a specific URL, use the browseUrl tool.'
    });
    
    tools = [
      {
        type: "function",
        function: {
          name: "browseUrl",
          description: "Fetches and reads the text content of a specific URL.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The full URL to browse (e.g., https://example.com)"
              }
            },
            required: ["url"]
          }
        }
      }
    ];
  }

  yield* processOpenAIStream(apiMessages, model, tools, signal);
}
