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
