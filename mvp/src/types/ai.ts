/**
 * 定义AI相关的类型
 */

// AI消息类型
export interface IAIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  contextNodes?: string[]; // 关联的节点ID
}

// AI对话类型
export interface IAIConversation {
  id: string;
  title: string;
  messages: IAIMessage[];
  graphId?: string; // 关联的图谱ID
  createdAt: string;
  updatedAt: string;
}

// AI模型类型
export type AIModel = 
  | 'gpt-3.5-turbo'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'gemini-pro'
  | 'local-llama';

// AI请求参数类型
export interface IAIRequestParams {
  model: AIModel;
  messages: Pick<IAIMessage, 'role' | 'content'>[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

// AI响应类型
export interface IAIResponse {
  id: string;
  message: IAIMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: AIModel;
}

// AI功能类型
export type AIFeature = 
  | 'summarize'
  | 'expand'
  | 'question'
  | 'connect'
  | 'critique'
  | 'rewrite'
  | 'translate'
  | 'explain'
  | 'custom';

// AI功能配置类型
export interface IAIFeatureConfig {
  feature: AIFeature;
  prompt: string;
  model: AIModel;
  temperature: number;
  maxTokens: number;
}

// 默认AI功能配置
// Default AI feature configuration
export const DEFAULT_AI_FEATURES: Record<AIFeature, IAIFeatureConfig> = {
  summarize: {
    feature: 'summarize',
    prompt: 'Please summarize the key points of the following content:',
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 500
  },
  expand: {
    feature: 'expand',
    prompt: 'Please expand on the following content, providing more related information:',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  },
  question: {
    feature: 'question',
    prompt: 'Based on the following content, generate 5 thoughtful questions:',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500
  },
  connect: {
    feature: 'connect',
    prompt: 'Analyze the connections and relationships between the following content:',
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 800
  },
  critique: {
    feature: 'critique',
    prompt: 'Please critically analyze the following content, pointing out strengths, weaknesses, and potential biases:',
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 800
  },
  rewrite: {
    feature: 'rewrite',
    prompt: 'Please rewrite the following content to make it clearer and more concise:',
    model: 'gpt-3.5-turbo',
    temperature: 0.4,
    maxTokens: 800
  },
  translate: {
    feature: 'translate',
    prompt: 'Please translate the following content to Chinese:',
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 1000
  },
  explain: {
    feature: 'explain',
    prompt: 'Please explain the following concepts in simple, easy-to-understand language:',
    model: 'gpt-3.5-turbo',
    temperature: 0.4,
    maxTokens: 800
  },
  custom: {
    feature: 'custom',
    prompt: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  }
}; 