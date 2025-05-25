import axios from 'axios';

// 添加用于测试连接的工具函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API提供商类型
export type AIProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'deepseek' 
  | 'gemini' 
  | 'qwen' 
  | 'groq'
  | 'ollama'
  | 'custom';

// 模型配置接口
export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  localPath?: string; // 仅用于Ollama
}

// 消息接口
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string; // 用于function消息
}

// API请求参数
export interface AIRequestParams {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
}

// AI服务配置
export interface AIServiceConfig {
  providers: {
    [key in AIProvider]?: {
      apiKey?: string;
      baseUrl?: string;
      models?: ModelConfig[];
    }
  };
  defaultProvider: AIProvider;
  proxyUrl: string;
  useProxy: boolean;
  ollamaEnabled: boolean;
  ollamaUrl: string;
}

// 默认配置
const defaultConfig: AIServiceConfig = {
  providers: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      models: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' }
      ]
    },
    anthropic: {
      baseUrl: 'https://api.anthropic.com/v1',
      models: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' }
      ]
    },
    deepseek: {
      baseUrl: 'https://api.deepseek.com/v1',
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek' }
      ]
    },
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: [
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'gemini' },
        { id: 'gemini-ultra', name: 'Gemini Ultra', provider: 'gemini' }
      ]
    },
    qwen: {
      baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
      models: [
        { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'qwen' },
        { id: 'qwen-plus', name: 'Qwen Plus', provider: 'qwen' }
      ]
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      models: [
        { id: 'llama2-70b-4096', name: 'Llama 2 70B', provider: 'groq' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq' }
      ]
    },
    ollama: {
      baseUrl: 'http://localhost:11434/api',
      models: [
        { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', provider: 'ollama' }
      ]  // 添加qwen2.5:7b模型
    },
    custom: {
      models: []  // 允许用户自定义
    }
  },
  defaultProvider: 'ollama', // 改为默认使用ollama
  proxyUrl: 'http://localhost:7070',
  useProxy: true,
  ollamaEnabled: true, // 启用ollama
  ollamaUrl: 'http://localhost:11434'
};

class AIService {
  private config: AIServiceConfig;
  private activeRequests: Map<string, AbortController> = new Map();

  constructor(initialConfig: Partial<AIServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...initialConfig };
  }

  // 更新配置
  public updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 更新特定提供商的配置
  public updateProviderConfig(provider: AIProvider, config: Partial<{ apiKey: string, baseUrl: string }>): void {
    if (!this.config.providers[provider]) {
      this.config.providers[provider] = {};
    }
    this.config.providers[provider] = { 
      ...this.config.providers[provider], 
      ...config 
    };
  }

  // 获取可用模型
  public async getAvailableModels(): Promise<ModelConfig[]> {
    const models: ModelConfig[] = [];
    
    // 获取所有配置的云端模型
    for (const [provider, config] of Object.entries(this.config.providers)) {
      if (config?.models) {
        models.push(...config.models);
      }
    }
    
    // 如果Ollama可用，获取本地模型
    if (this.config.ollamaEnabled) {
      try {
        const ollamaModels = await this.fetchOllamaModels();
        models.push(...ollamaModels);
      } catch (error) {
        console.error('Failed to fetch Ollama models:', error);
      }
    }
    
    return models;
  }

  // 获取Ollama模型
  private async fetchOllamaModels(): Promise<ModelConfig[]> {
    try {
      const response = await axios.get(`${this.config.ollamaUrl}/api/tags`);
      if (response.data && response.data.models) {
        // 确保我们所需的qwen2.5:7b模型在列表中
        const models = response.data.models.map((model: any) => ({
          id: model.name,
          name: model.name,
          provider: 'ollama' as AIProvider,
          localPath: `${this.config.ollamaUrl}/api`
        }));
        
        // 如果在API返回的模型列表中没有找到qwen2.5:7b，手动添加它
        const hasQwen = models.some((model: ModelConfig) => model.id === 'qwen2.5:7b');
        if (!hasQwen) {
          models.push({
            id: 'qwen2.5:7b',
            name: 'Qwen 2.5 7B',
            provider: 'ollama' as AIProvider,
            localPath: `${this.config.ollamaUrl}/api`
          });
        }
        
        return models;
      }
      
      // 如果没有得到正确的响应，返回默认的Ollama模型列表
      return [{
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 7B',
        provider: 'ollama' as AIProvider,
        localPath: `${this.config.ollamaUrl}/api`
      }];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      
      // 即使出错，也返回默认的Ollama模型列表，确保界面上有可选择的模型
      return [{
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 7B',
        provider: 'ollama' as AIProvider,
        localPath: `${this.config.ollamaUrl}/api`
      }];
    }
  }

  // 发送AI请求
  public async sendRequest(params: AIRequestParams): Promise<{ 
    text: string; 
    requestId: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    try {
      // 构建请求配置
      const apiConfig = this.buildApiConfig(params, requestId, controller.signal);
      
      console.log(`正在发送请求到 ${apiConfig.url}`, {
        model: params.model,
        provider: params.provider,
        temperature: params.temperature,
        maxTokens: params.maxTokens
      });
      
      // 发送请求
      const response = await axios(apiConfig);
      
      console.log(`请求成功，获取响应:`, {
        status: response.status,
        statusText: response.statusText,
        dataPreview: JSON.stringify(response.data).substring(0, 100) + '...'
      });
      
      // 处理响应
      const result = this.processResponse(response, params.provider);
      
      return {
        text: result.text,
        requestId,
        usage: result.usage
      };
    } catch (error) {
      console.error('AI请求失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios错误详情:', {
          request: error.request ? {
            method: error.config?.method,
            url: error.config?.url,
            data: error.config?.data ? JSON.stringify(error.config.data).substring(0, 200) + '...' : null
          } : 'No request',
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : 'No response'
        });
      }
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  // 构建API配置
  private buildApiConfig(params: AIRequestParams, requestId: string, signal: AbortSignal): any {
    const { model, messages, temperature = 0.7, maxTokens, stream = false, provider } = params;
    
    // 为Ollama使用智能选择的API调用方式
    if (provider === 'ollama' as AIProvider) {
      console.log('构建Ollama请求...');
      
      // 判断是否需要使用chat API
      const needsChat = this.shouldUseChatAPI(messages, model);
      const apiEndpoint = needsChat ? '/api/ollama/chat' : '/api/ollama/generate';
      
      console.log(`选择使用 ${needsChat ? 'chat' : 'generate'} API，模型: ${model}`);
      
      if (needsChat) {
        // 使用chat API
        return {
          method: 'POST',
          url: apiEndpoint,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            model,
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            options: {
              temperature,
              num_predict: maxTokens || 2048
            },
            stream: false // 明确设置为false避免流式响应问题
          },
          signal
        };
      } else {
        // 使用generate API
      const prompt = this.formatMessagesToPrompt(messages, model);
      console.log('构建的提示字符串:', prompt.substring(0, 100) + '...');
      
      return {
        method: 'POST',
          url: apiEndpoint,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          model,
          prompt,
          options: {
            temperature,
            num_predict: maxTokens || 2048
            },
            stream: false // 明确设置为false避免流式响应问题
        },
        signal
      };
      }
    }
    
    // 使用代理服务器处理其他AI提供商
    if (this.config.useProxy) {
      let endpoint;
      let data;
      
      switch (provider) {
        case 'openai':
          endpoint = `${this.config.proxyUrl}/openai`;
          data = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
            requestId,
            apiKey: params.apiKey || this.config.providers[provider]?.apiKey,
            apiEndpoint: params.baseUrl || this.config.providers[provider]?.baseUrl
          };
          break;
        case 'anthropic':
          endpoint = `${this.config.proxyUrl}/anthropic`;
          data = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
            requestId,
            apiKey: params.apiKey || this.config.providers[provider]?.apiKey,
            apiEndpoint: params.baseUrl || this.config.providers[provider]?.baseUrl
          };
          break;
        case 'deepseek':
          endpoint = `${this.config.proxyUrl}/deepseek`;
          data = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
            requestId,
            apiKey: params.apiKey || this.config.providers[provider]?.apiKey,
            apiEndpoint: params.baseUrl || this.config.providers[provider]?.baseUrl
          };
          break;
        case 'gemini':
          endpoint = `${this.config.proxyUrl}/gemini`;
          data = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
            requestId,
            apiKey: params.apiKey || this.config.providers[provider]?.apiKey,
            apiEndpoint: params.baseUrl || this.config.providers[provider]?.baseUrl
          };
          break;
        case 'qwen':
          endpoint = `${this.config.proxyUrl}/qwen`;
          data = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
            requestId,
            apiKey: params.apiKey || this.config.providers[provider]?.apiKey,
            apiEndpoint: params.baseUrl || this.config.providers[provider]?.baseUrl
          };
          break;
        case 'groq':
          endpoint = `${this.config.proxyUrl}/groq`;
          data = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
            requestId,
            apiKey: params.apiKey || this.config.providers[provider]?.apiKey,
            apiEndpoint: params.baseUrl || this.config.providers[provider]?.baseUrl
          };
          break;
        case 'custom':
          endpoint = `${this.config.proxyUrl}/custom`;
          data = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
            requestId,
            apiKey: params.apiKey || this.config.providers[provider]?.apiKey,
            apiEndpoint: params.baseUrl || this.config.providers[provider]?.baseUrl
          };
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      return {
        method: 'POST',
        url: endpoint,
        data,
        signal
      };
    } 
    // 直接调用API（不推荐，因为可能涉及CORS问题）
    else {
      // 根据不同提供商构建请求
      switch (provider) {
        case 'openai':
        case 'groq':
          return {
            method: 'POST',
            url: `${params.baseUrl || this.config.providers[provider]?.baseUrl}/chat/completions`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${params.apiKey || this.config.providers[provider]?.apiKey}`
            },
            data: {
              model,
              messages,
              temperature,
              max_tokens: maxTokens,
              stream
            },
            signal
          };
          
        case 'anthropic':
          return {
            method: 'POST',
            url: `${params.baseUrl || this.config.providers[provider]?.baseUrl}/messages`,
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': params.apiKey || this.config.providers[provider]?.apiKey,
              'anthropic-version': '2023-06-01'
            },
            data: {
              model,
              messages,
              temperature,
              max_tokens: maxTokens,
              stream
            },
            signal
          };
          
        case 'ollama':
          return {
            method: 'POST',
            url: `/api/ollama/generate`,
            headers: {
              'Content-Type': 'application/json'
            },
            data: {
              model,
              prompt: this.formatMessagesToPrompt(messages, model),
              stream,
              options: { 
                temperature,
                num_predict: maxTokens 
              }
            },
            signal
          };
          
        // 其他提供商...
        default:
          throw new Error(`Direct API call not supported for provider: ${provider}`);
      }
    }
  }

  // 将消息数组格式化为Ollama所需的提示字符串
  private formatMessagesToPrompt(messages: Message[], modelId?: string): string {
    // 检查是否使用的是Qwen模型
    const isQwenModel = (modelId?: string) => {
      return modelId?.toLowerCase().includes('qwen');
    };
    
    // 检查是否使用的是Llama或Mistral模型
    const isLlamaOrMistral = (modelId?: string) => {
      return modelId?.toLowerCase().includes('llama') || 
             modelId?.toLowerCase().includes('mistral');
    };
    
    // 检查是否使用的是Gemma模型
    const isGemmaModel = (modelId?: string) => {
      return modelId?.toLowerCase().includes('gemma');
    };
    
    // 检查是否使用的是Phi模型
    const isPhiModel = (modelId?: string) => {
      return modelId?.toLowerCase().includes('phi');
    };
    
    // 为Qwen模型使用特定的格式
    if (isQwenModel(modelId)) {
      let prompt = '';
      
      // 合并所有系统消息
      const systemMessages = messages.filter(msg => msg.role === 'system');
      if (systemMessages.length > 0) {
        prompt += `<|im_start|>system\n${systemMessages.map(msg => msg.content).join('\n\n')}<|im_end|>\n`;
      }
      
      // 添加用户和助手消息
      for (const message of messages) {
        // 跳过系统消息，因为已经处理过了
        if (message.role === 'system') continue;
        
        switch (message.role) {
          case 'user':
            prompt += `<|im_start|>user\n${message.content}<|im_end|>\n`;
            break;
          case 'assistant':
            prompt += `<|im_start|>assistant\n${message.content}<|im_end|>\n`;
            break;
          case 'function':
            prompt += `<|im_start|>function\n${message.name}: ${message.content}<|im_end|>\n`;
            break;
        }
      }
      
      // 添加助手回复标记
      prompt += `<|im_start|>assistant\n`;
      return prompt;
    }
    
    // Llama和Mistral模型格式
    if (isLlamaOrMistral(modelId)) {
      let prompt = '';
      
      // 提取系统消息
      const systemMessages = messages.filter(msg => msg.role === 'system');
      if (systemMessages.length > 0) {
        prompt += `<s>[INST] <<SYS>>\n${systemMessages.map(msg => msg.content).join('\n\n')}\n<</SYS>>\n\n`;
      } else {
        prompt += `<s>[INST] `;
      }
      
      // 添加消息对话历史
      let isFirstUserMessage = true;
      let lastRole = '';
      
      for (const message of messages) {
        if (message.role === 'system') continue; // 跳过系统消息，因为已经处理过
        
        if (message.role === 'user') {
          if (!isFirstUserMessage) {
            prompt += lastRole === 'assistant' ? `\n\n[INST] ${message.content} [/INST]` : ` ${message.content} [/INST]`;
          } else {
            // 第一个用户消息已经有[INST]标记
            if (systemMessages.length > 0) {
              prompt += `${message.content} [/INST]`;
            } else {
              prompt += `${message.content} [/INST]`;
            }
            isFirstUserMessage = false;
          }
        } else if (message.role === 'assistant') {
          prompt += ` ${message.content} </s>`;
        } else if (message.role === 'function') {
          prompt += ` Function ${message.name}: ${message.content}`;
        }
        
        lastRole = message.role;
      }
      
      // 如果最后一条消息是用户消息，为助手添加空白响应
      if (lastRole === 'user') {
        prompt += ` `;
      }
      
      return prompt;
    }
    
    // Gemma模型格式
    if (isGemmaModel(modelId)) {
      let prompt = '';
      
      // 提取系统消息
      const systemMessages = messages.filter(msg => msg.role === 'system');
      if (systemMessages.length > 0) {
        // Gemma将系统提示作为用户指令的一部分
        prompt += `<start_of_turn>user\n系统指令: ${systemMessages.map(msg => msg.content).join('\n\n')}\n\n`;
      }
      
      // 添加对话历史
      for (const message of messages) {
        if (message.role === 'system') continue; // 跳过系统消息，已单独处理
        
        if (message.role === 'user') {
          if (!prompt.includes('<start_of_turn>user')) {
            prompt += `<start_of_turn>user\n${message.content}<end_of_turn>\n`;
          } else {
            // 如果已经有系统消息作为用户指令，则附加用户消息
            prompt += `${message.content}<end_of_turn>\n`;
          }
        } else if (message.role === 'assistant') {
          prompt += `<start_of_turn>model\n${message.content}<end_of_turn>\n`;
        }
      }
      
      // 添加最后的模型回复标记
      prompt += `<start_of_turn>model\n`;
      return prompt;
    }
    
    // Phi模型格式
    if (isPhiModel(modelId)) {
      let prompt = '';
      
      // 提取系统消息
      const systemMessages = messages.filter(msg => msg.role === 'system');
      if (systemMessages.length > 0) {
        prompt += `<|system|>\n${systemMessages.map(msg => msg.content).join('\n\n')}\n`;
      }
      
      // 添加对话历史
      for (const message of messages) {
        if (message.role === 'system') continue; // 跳过系统消息
        
        if (message.role === 'user') {
          prompt += `<|user|>\n${message.content}\n`;
        } else if (message.role === 'assistant') {
          prompt += `<|assistant|>\n${message.content}\n`;
        }
      }
      
      // 添加最后的助手标记
      prompt += `<|assistant|>\n`;
      return prompt;
    }
    
    // 其他模型的通用格式
    let prompt = '';
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `系统: ${message.content}\n\n`;
          break;
        case 'user':
          prompt += `用户: ${message.content}\n\n`;
          break;
        case 'assistant':
          prompt += `助手: ${message.content}\n\n`;
          break;
        case 'function':
          prompt += `函数(${message.name}): ${message.content}\n\n`;
          break;
      }
    }
    
    // 添加最后的提示，表明该AI回答
    prompt += '助手: ';
    
    return prompt;
  }

  // 处理响应
  private processResponse(response: any, provider: AIProvider): { text: string; usage?: any } {
    if (!response.data) {
      throw new Error('Empty response received');
    }
    
    switch (provider) {
      case 'openai':
      case 'groq':
        return {
          text: response.data.choices[0].message.content,
          usage: response.data.usage
        };
        
      case 'anthropic':
        return {
          text: response.data.content[0].text,
          usage: response.data.usage
        };
        
      case 'ollama':
        console.log('处理Ollama响应:', JSON.stringify(response.data).substring(0, 200) + '...');
        
        // 首先检查response.data是否存在
        if (!response.data) {
          console.error('Ollama响应为空');
          return { text: "Ollama响应为空", usage: {} };
        }
        
        try {
          // 1. 处理/api/generate响应格式
        if (typeof response.data.response === 'string') {
          console.log('检测到Ollama /api/generate响应格式');
          return {
            text: response.data.response,
            usage: { 
              promptTokens: response.data.prompt_eval_count || 0,
              completionTokens: response.data.eval_count || 0,
              totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
            }
          };
        } 
        
          // 2. 处理/api/chat响应格式
        if (response.data.message && typeof response.data.message.content === 'string') {
          console.log('检测到Ollama /api/chat响应格式');
          return {
            text: response.data.message.content,
            usage: { 
              promptTokens: response.data.prompt_eval_count || 0,
              completionTokens: response.data.eval_count || 0,
              totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
            }
          };
        }
          
          // 3. 处理流式响应被错误地作为JSON返回的情况
          if (Array.isArray(response.data) || (typeof response.data === 'string' && response.data.includes('{"model":'))) {
            console.log('检测到可能的流式响应格式');
            return this.extractTextFromStreamResponse(response.data);
          }
          
          // 4. 处理其他可能的响应格式
          // 尝试在响应对象中查找任何可能的文本内容
          const possibleTextFields = ['output', 'text', 'content', 'completion', 'answer'];
          for (const field of possibleTextFields) {
            if (response.data[field] && typeof response.data[field] === 'string') {
              console.log(`在字段 ${field} 中找到响应文本`);
              return {
                text: response.data[field],
                usage: {}
              };
            }
        }
        
        // 最后的降级处理 - 尝试将整个响应转换为文本
        console.warn('无法识别的Ollama响应格式，尝试直接返回响应数据');
        return {
          text: typeof response.data === 'string' 
            ? response.data 
            : JSON.stringify(response.data, null, 2),
          usage: {}
        };
        } catch (error) {
          console.error('处理Ollama响应时出错:', error);
          return {
            text: `处理响应时出错: ${error instanceof Error ? error.message : '未知错误'}`,
            usage: {}
          };
        }
        
      // 其他提供商...
      default:
        return {
          text: response.data
        };
    }
  }
  
  /**
   * 从流式响应中提取文本
   */
  private extractTextFromStreamResponse(data: any): { text: string; usage?: any } {
    try {
      // 如果data已经是字符串，尝试解析成JSON
      let responseArray = data;
      if (typeof data === 'string') {
        // 检查是否是NDJSON格式（每行一个JSON对象）
        if (data.includes('\n')) {
          responseArray = data.split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch {
                return line;
              }
            });
        } else {
          // 单个JSON字符串
          try {
            responseArray = [JSON.parse(data)];
          } catch {
            responseArray = [data];
          }
        }
      }
      
      // 如果不是数组，转换为数组便于处理
      if (!Array.isArray(responseArray)) {
        responseArray = [responseArray];
      }
      
      // 从数组中提取内容
      let fullText = '';
      let promptTokens = 0;
      let completionTokens = 0;
      
      for (const item of responseArray) {
        if (typeof item === 'string') {
          fullText += item;
          continue;
        }
        
        // 处理不同格式的流式响应项
        if (item.response) {
          fullText += item.response;
        } else if (item.content) {
          fullText += item.content;
        } else if (item.message?.content) {
          fullText += item.message.content;
        } else if (item.text) {
          fullText += item.text;
        } else if (item.choices?.[0]?.text) {
          fullText += item.choices[0].text;
        } else if (item.choices?.[0]?.message?.content) {
          fullText += item.choices[0].message.content;
        }
        
        // 提取token计数
        if (item.prompt_eval_count) promptTokens += item.prompt_eval_count;
        if (item.eval_count) completionTokens += item.eval_count;
      }
      
      return {
        text: fullText,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        }
      };
    } catch (error) {
      console.error('从流式响应中提取文本时出错:', error);
      return {
        text: '从流式响应中提取文本失败',
        usage: {}
        };
    }
  }

  // 取消请求
  public cancelRequest(requestId: string): boolean {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      return true;
    }
    return false;
  }

  // 测试API连接
  public async testConnection(provider: AIProvider, apiKey?: string, baseUrl?: string): Promise<boolean> {
    try {
      const testParams: AIRequestParams = {
        model: this.getDefaultModelForProvider(provider),
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.3,
        maxTokens: 10,
        provider,
        apiKey,
        baseUrl
      };
      
      const result = await this.sendRequest(testParams);
      return !!result.text;
    } catch (error) {
      console.error(`Connection test failed for ${provider}:`, error);
      return false;
    }
  }

  // 获取提供商的默认模型
  private getDefaultModelForProvider(provider: AIProvider): string {
    const models = this.config.providers[provider]?.models;
    if (models && models.length > 0) {
      return models[0].id;
    }
    
    // 默认模型ID
    switch (provider) {
      case 'openai': return 'gpt-3.5-turbo';
      case 'anthropic': return 'claude-3-haiku-20240307';
      case 'deepseek': return 'deepseek-chat';
      case 'gemini': return 'gemini-pro';
      case 'qwen': return 'qwen-turbo';
      case 'groq': return 'llama2-70b-4096';
      case 'ollama': return 'qwen2.5:7b';
      default: return '';
    }
  }

  /**
   * 测试Ollama连接 - 尝试多种方式建立连接
   * @param model 测试的模型名称
   * @param includeModelTest 是否测试模型调用
   * @returns 连接是否成功
   */
  public async testOllamaConnection(
    model: string = "qwen2.5:7b",
    includeModelTest: boolean = true
  ): Promise<boolean> {
    console.log(`开始测试Ollama连接，目标模型: ${model}`);
    console.log(`浏览器环境: ${navigator.userAgent}`);
    
    // 记录测试时间和尝试次数
    const startTime = Date.now();
    let useProxy = false;
    let connectionDetails: any = null;
    
    try {
      // 尝试多种连接方式
      const connectionMethods = [
        { name: "代理连接", url: "/api/ollama/tags", directConnect: false },
        { name: "直接连接", url: "http://localhost:11434/api/tags", directConnect: true }
      ];
      
      let isConnected = false;
      
      // 遍历尝试不同的连接方式
      for (const method of connectionMethods) {
        try {
          console.log(`尝试 ${method.name} 到 ${method.url}`);
          const response = await axios.get(method.url, { 
            timeout: 5000,
            headers: { 'Accept': 'application/json' }
          });
          
          // 检查是否成功
          if (response.status === 200) {
            console.log(`${method.name}成功! 状态码: ${response.status}`);
            
            // 检查是否返回了模型列表
            const models = response.data?.models || [];
            console.log(`发现 ${models.length} 个可用模型`);
            
            // 检查是否包含特定模型
            const hasRequestedModel = models.some((m: any) => 
              m.name === model || m.name.toLowerCase() === model.toLowerCase()
            );
            
            console.log(`是否包含请求的模型 "${model}": ${hasRequestedModel ? '是' : '否'}`);
            
            // 保存连接详情
            isConnected = true;
            connectionDetails = {
              method: method.name,
              url: method.url,
              responseTime: Date.now() - startTime,
              models: models,
              hasRequestedModel
            };
            
            // 设置是否使用代理
            useProxy = !method.directConnect;
            
            // 找到成功的连接方法，跳出循环
            break;
          }
        } catch (methodError: any) {
          const errorDetails = axios.isAxiosError(methodError) ? 
            {
            code: methodError.code,
            message: methodError.message,
              response: methodError.response?.status,
            data: methodError.response?.data
            } : methodError.message;
            
          console.warn(`${method.name}失败:`, errorDetails);
        }
      }
      
      // 如果所有连接尝试都失败
      if (!isConnected) {
        throw new Error(
          '无法连接到Ollama服务。请确保:\n' +
          '1. Ollama已安装并运行 (运行命令 "ollama serve")\n' +
          '2. 服务默认端口11434未被占用或阻止\n' +
          '3. 如果在不同机器上，需要设置OLLAMA_HOST环境变量\n' +
          '4. 检查防火墙或代理设置是否阻止了连接'
        );
      }
      
      // 如果需要，测试模型调用
      if (includeModelTest && connectionDetails) {
        try {
          console.log(`测试模型 "${model}" 可用性...`);
          
          // 根据是否使用代理选择URL
          const apiUrl = useProxy ? '/api/ollama/chat' : 'http://localhost:11434/api/chat';
          
          // 构造简单的测试请求
          const testRequest = {
            model: model,
            messages: [{ role: "user" as const, content: "Hello, this is a connection test." }],
            stream: false,
            options: {
              temperature: 0.01,
              num_predict: 10
            }
          };
          
          // 检查模型之前，先判断模型是否可用
          if (!connectionDetails.hasRequestedModel) {
            console.warn(`警告: 模型 "${model}" 在可用模型列表中未找到，测试可能会失败`);
          }
          
          // 发送请求
          const modelResponse = await axios.post(apiUrl, testRequest, { 
            headers: { 'Content-Type': 'application/json' }, 
            timeout: 10000 
          });
          
          // 判断是否成功
          if (modelResponse.status === 200) {
            console.log('模型测试成功!');
            
            // 检查响应是否包含预期内容
            const hasContent = modelResponse.data?.message?.content || 
                                   modelResponse.data?.response || 
                             modelResponse.data?.text;
            
            if (hasContent) {
              console.log(`模型响应内容: ${hasContent.substring(0, 50)}...`);
          } else {
              console.warn('警告: 模型响应无内容，但状态码正常');
            }
          }
        } catch (modelError: any) {
          // 模型测试失败，但连接测试已成功
          console.warn(`模型测试失败:`, modelError.message);
          
          if (modelError.response?.status === 404) {
              console.warn(`模型 "${model}" 可能未安装，请使用 "ollama pull ${model}" 命令下载`);
            // 不要抛出错误，因为我们只是测试模型可用性
          } else if (modelError.response?.status === 400) {
            console.warn(`模型请求参数可能不正确: ${modelError.response.data?.error || modelError.message}`);
          } else {
            console.warn(`模型测试未知错误: ${modelError.message}`);
          }
        }
      }
      
      // 记录成功的连接信息
      console.log(`Ollama连接测试成功，耗时: ${Date.now() - startTime}ms`);
      return true;
    } catch (error: any) {
      // 提供明确的错误原因和解决方案
      let errorMessage = `无法连接到Ollama服务: ${error.message}`;
      let solutionSuggestion = '';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = '连接被拒绝：Ollama服务可能未运行。';
        solutionSuggestion = '请运行 "ollama serve" 命令启动服务。';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = '连接超时：Ollama服务响应时间过长或网络问题。';
        solutionSuggestion = '请检查网络连接或服务器负载。';
      } else if (error.message.includes('Network Error')) {
        errorMessage = '网络错误：浏览器无法建立连接。';
        solutionSuggestion = '请检查您的网络连接、防火墙设置或Ollama服务状态。';
      }
      
      console.error(`Ollama连接测试失败: ${errorMessage}`);
      console.error(`建议解决方案: ${solutionSuggestion}`);
      
      throw new Error(`${errorMessage} ${solutionSuggestion}`);
    }
  }
  
  /**
   * 带有智能重试机制的Ollama请求方法
   * @param model 模型名称
   * @param messages 消息数组
   * @param temperature 温度参数，控制随机性
   * @returns 包含生成文本和请求ID的对象
   */
  public async ollamaRequestWithRetry(
    model: string, 
    messages: Message[], 
    temperature: number = 0.7
  ): Promise<{ text: string; requestId: string }> {
    const requestId = `ollama_retry_${Date.now()}`;
    const startTime = Date.now();
    
    // 定义重试参数
    const maxRetries = 2;
    const initialBackoff = 800; // 初始等待时间（毫秒）
    let attempt = 0;
    
    // 记录所有尝试的错误
    const allErrors: any[] = [];
    
    // 首先检查连接
    try {
      await this.testOllamaConnection(model, false);
    } catch (connectionError) {
      console.error('连接测试失败，但仍将尝试发送请求:', connectionError);
      // 不阻止请求，我们仍然会尝试发送
    }
    
    // 请求策略列表，按优先级排序
    const strategies = [
      {
        name: 'chat API',
        fn: async () => {
          console.log(`尝试使用chat API调用模型 ${model}...`);
          return await this.ollamaChatCompletion(messages, model, temperature);
        },
        shouldUse: this.shouldUseChatAPI(messages, model)
      },
      {
        name: 'generate API',
        fn: async () => {
          console.log(`尝试使用generate API调用模型 ${model}...`);
          const prompt = this.formatMessagesToPrompt(messages, model);
          return await this.pythonStyleOllamaRequest(prompt, model, messages.find(m => m.role === 'system')?.content);
        },
        shouldUse: !this.shouldUseChatAPI(messages, model)
      },
      {
        name: '直接调用',
        fn: async () => {
          console.log(`尝试使用sendRequest方法调用模型 ${model}...`);
          const response = await this.sendRequest({
            model,
            messages,
            temperature,
            provider: 'ollama'
          });
          return response.text;
        },
        shouldUse: true // 总是可以尝试
      }
    ];
    
    // 根据优先级对策略进行排序
    const prioritizedStrategies = [
      ...strategies.filter(s => s.shouldUse),
      ...strategies.filter(s => !s.shouldUse)
    ];
    
    // 尝试每个策略，直到成功或所有策略都失败
    for (const strategy of prioritizedStrategies) {
      attempt = 0;
      while (attempt <= maxRetries) {
        try {
          console.log(`使用 ${strategy.name} 策略, 尝试 ${attempt + 1}/${maxRetries + 1}`);
          const result = await strategy.fn();
          
          // 策略成功，返回结果
          console.log(`${strategy.name} 策略成功，耗时: ${Date.now() - startTime}ms`);
          
          // 格式化返回结果
          if (typeof result === 'string') {
          return {
              text: result,
              requestId: `${requestId}_${strategy.name.replace(' ', '_')}`
          };
        } else {
            return result;
        }
        } catch (error: any) {
        attempt++;
          allErrors.push({
            strategy: strategy.name,
          attempt,
            error: error.message || '未知错误',
            timestamp: new Date().toISOString()
          });
          
          console.warn(`${strategy.name} 策略失败 (尝试 ${attempt}/${maxRetries + 1}):`, error.message);
        
        if (attempt <= maxRetries) {
          // 指数退避策略
          const backoff = initialBackoff * Math.pow(2, attempt - 1);
          console.log(`等待 ${backoff}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        } else {
            // 这个策略的所有尝试都失败，尝试下一个策略
            console.error(`${strategy.name} 策略在 ${maxRetries + 1} 次尝试后失败，尝试下一个策略`);
            break;
          }
        }
      }
    }
    
    // 所有策略都失败，准备详细的错误报告
    console.error('所有Ollama请求策略均失败:');
    console.error(JSON.stringify(allErrors, null, 2));
      
      // 构造用户友好的错误消息
    const errorReport = `无法完成Ollama请求 (尝试了 ${allErrors.length} 种方法)。`;
    const lastError = allErrors[allErrors.length - 1];
    const errorDetails = lastError ? `最后错误: ${lastError.error}` : '未知错误';
    const suggestion = '请确保Ollama服务正在运行，且模型已正确安装。';
    
    throw new Error(`${errorReport} ${errorDetails}. ${suggestion}`);
  }

  /**
   * 使用类似Python风格的简化请求调用Ollama
   * 该方法使用更直接的prompt方式，可能在某些场合下更稳定
   */
  public async pythonStyleOllamaRequest(
    prompt: string,
    model: string = "qwen2.5:7b",
    systemPrompt: string = ""
  ): Promise<string> {
    try {
      console.log(`使用Python风格请求调用Ollama，模型: ${model}`);
      console.log(`提示词长度: ${prompt.length}, 系统提示词: ${systemPrompt ? '有' : '无'}`);

      let fullPrompt = prompt;
      
      // 如果有系统提示词，添加到主提示词前面
      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\n${prompt}`;
      }
      
      // 构建完整的请求数据
      const requestData = {
        model: model,
        prompt: fullPrompt,
          options: {
            temperature: 0.7,
            num_predict: 4096
        },
        stream: false
      };
      
      console.log(`发送Python风格请求到 /api/ollama/generate`);
      
      // 发送请求
      const response = await axios.post('/api/ollama/generate', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 120000 // 2分钟超时
      });
      
      console.log(`Python风格请求响应状态: ${response.status}`);
      
      // 检查响应状态
      if (response.status !== 200) {
        throw new Error(`Ollama API返回错误状态: ${response.status}`);
      }
      
      // 提取响应内容
      if (response.data && response.data.response) {
        const content = response.data.response;
        console.log('从generate响应中提取内容成功:', content.substring(0, 50) + '...');
        return content;
      } else if (response.data && typeof response.data === 'string') {
        console.log('响应是字符串格式，直接返回');
        return response.data;
      } else if (response.data) {
        // 尝试查找其他可能的响应字段
        const possibleFields = ['text', 'content', 'output', 'completion'];
        for (const field of possibleFields) {
          if (response.data[field] && typeof response.data[field] === 'string') {
            console.log(`从${field}字段中提取内容`);
            return response.data[field];
          }
        }
        
        // 尝试从流式响应中提取
        if (Array.isArray(response.data) || 
            (typeof response.data === 'string' && response.data.includes('{"model":'))) {
          const extractedText = this.extractTextFromStreamResponse(response.data);
          return extractedText.text;
        }
        
        // 其他情况尝试将整个响应转换为字符串
        console.warn('未找到标准响应格式，尝试解析整个响应对象');
        return JSON.stringify(response.data, null, 2);
      }
      
      throw new Error('无法从响应中提取有效内容');
    } catch (error) {
      console.error('Python风格Ollama请求失败:', error);
      
      // 构造用户友好的错误消息
      let userMessage = '与Ollama generate API通信失败';
      let technicalDetails = '';
      
      if (axios.isAxiosError(error)) {
        technicalDetails = `请求错误: ${error.message}`;
        
        if (error.response) {
          technicalDetails += `, 状态码: ${error.response.status}`;
          
          if (error.response.data) {
            if (typeof error.response.data === 'string') {
              technicalDetails += `, 响应: ${error.response.data}`;
            } else if (error.response.data.error) {
              technicalDetails += `, 错误: ${error.response.data.error}`;
            }
          }
        }
        
        if (error.code === 'ECONNABORTED') {
          userMessage = 'Ollama请求超时。这可能是因为模型较大或服务器负载过高，请稍后重试。';
        } else if (error.message.includes('Network Error')) {
          userMessage = '无法连接到Ollama服务。请确保服务正在运行并可以通过http://localhost:11434访问。';
        } else if (error.response?.status === 404) {
          userMessage = `找不到模型"${model}"。请确保您已经使用'ollama pull ${model}'命令下载了该模型。`;
        } else if (error.response?.status === 400) {
          userMessage = `请求参数有误: ${error.response.data?.error || '未知错误'}`;
        } else if (error.response?.status === 500) {
          userMessage = '服务器内部错误。请检查Ollama日志或重启服务。';
        }
      } else {
        technicalDetails = error instanceof Error ? error.message : '未知错误';
      }
      
      throw new Error(`${userMessage} (${technicalDetails})`);
    }
  }

  /**
   * 使用Ollama的chat API发送聊天请求
   * @param messages 消息数组
   * @param model 模型名称
   * @param temperature 温度参数，控制随机性
   * @returns 返回AI响应文本
   */
  public async ollamaChatCompletion(
    messages: Message[],
    model: string = "qwen2.5:7b",
    temperature: number = 0.7
  ): Promise<string> {
    try {
      console.log(`使用ollamaChatCompletion方法调用模型: ${model}`);
      
      // 构建请求数据
      const requestData = {
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: false,
        options: {
          temperature,
          num_predict: 4096 // 设置足够大的token限制
        }
      };
      
      // 发送请求
      console.log(`发送请求到 /api/ollama/chat，模型: ${model}, 温度: ${temperature}`);
      console.log(`消息数量: ${messages.length}, 第一条消息: ${messages[0]?.role} - ${messages[0]?.content?.substring(0, 50)}...`);
      
      const response = await axios.post('/api/ollama/chat', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 120000 // 2分钟超时
      });
      
      console.log('Ollama chat响应状态:', response.status);
      
      // 处理响应
      if (response.status !== 200) {
        throw new Error(`Ollama API返回错误状态: ${response.status}`);
      }
      
      // 提取响应内容
      if (response.data?.message?.content) {
        const content = response.data.message.content;
        console.log('从chat响应中提取content成功:', content.substring(0, 50) + '...');
        return content;
      } else if (response.data?.response) {
        // 某些配置下可能会返回response字段
        const content = response.data.response;
        console.log('从response字段提取内容成功:', content.substring(0, 50) + '...');
        return content;
      } else if (response.data?.text) {
        // 某些配置下可能会返回text字段
        const content = response.data.text;
        console.log('从text字段提取内容成功:', content.substring(0, 50) + '...');
        return content;
        } else if (typeof response.data === 'string') {
        // 某些配置下可能直接返回字符串
        console.log('响应是字符串格式，直接返回');
          return response.data;
        } else {
        // 尝试从流式响应中提取内容
        if (Array.isArray(response.data) || 
            (typeof response.data === 'string' && response.data.includes('{"model":'))) {
          const extractedText = this.extractTextFromStreamResponse(response.data);
          return extractedText.text;
        }
        
        // 最后尝试转换为JSON字符串
        console.warn('未找到标准响应格式，尝试解析整个响应对象');
        return JSON.stringify(response.data, null, 2);
      }
    } catch (error) {
      console.error('Ollama chat调用失败:', error);
      
      // 构造用户友好的错误消息
      let userMessage = '与Ollama chat API通信失败';
      let technicalDetails = '';
      
      if (axios.isAxiosError(error)) {
        technicalDetails = `请求错误: ${error.message}`;
        
        if (error.response) {
          technicalDetails += `, 状态码: ${error.response.status}`;
          
          if (error.response.data) {
            if (typeof error.response.data === 'string') {
              technicalDetails += `, 响应: ${error.response.data}`;
            } else if (error.response.data.error) {
              technicalDetails += `, 错误: ${error.response.data.error}`;
            }
          }
        }
        
        if (error.code === 'ECONNABORTED') {
          userMessage = 'Ollama请求超时。这可能是因为模型较大或服务器负载过高，请稍后重试。';
      } else if (error.message.includes('Network Error')) {
          userMessage = '无法连接到Ollama服务。请确保服务正在运行并可以通过http://localhost:11434访问。';
      } else if (error.response?.status === 404) {
          userMessage = `找不到模型"${model}"。请确保您已经使用'ollama pull ${model}'命令下载了该模型。`;
        } else if (error.response?.status === 400) {
          userMessage = `请求参数有误: ${error.response.data?.error || '未知错误'}`;
      } else if (error.response?.status === 500) {
          userMessage = '服务器内部错误。请检查Ollama日志或重启服务。';
        }
      } else {
        technicalDetails = error instanceof Error ? error.message : '未知错误';
      }
      
      throw new Error(`${userMessage} (${technicalDetails})`);
    }
  }

  /**
   * 判断是否应该使用chat API而不是generate API
   * @param messages 消息数组
   * @param modelId 模型ID
   * @returns 是否应该使用chat API
   */
  private shouldUseChatAPI(messages: Message[], modelId?: string): boolean {
    // 1. 如果有多个消息并且包含assistant角色，优先使用chat API
    const hasMultipleMessages = messages.length > 1;
    const hasAssistantMessage = messages.some(msg => msg.role === 'assistant');
    
    if (hasMultipleMessages && hasAssistantMessage) {
      return true;
    }
    
    // 2. 根据模型类型选择API
    // 这些模型更适合使用chat API
    const chatPreferredModels = [
      'qwen', 'llama', 'mistral', 'gemma', 'phi', 'stablelm', 'neural-chat',
      'vicuna', 'falcon', 'orca', 'yi', 'solar', 'cohere'
    ];
    
    const modelIdLower = modelId?.toLowerCase() || '';
    
    for (const modelPrefix of chatPreferredModels) {
      if (modelIdLower.includes(modelPrefix)) {
        return true;
      }
    }
    
    // 3. 如果有系统消息，优先使用chat API
    if (messages.some(msg => msg.role === 'system')) {
      return true;
    }
    
    // 默认使用generate API
    return false;
  }

  /**
   * 为generate API格式化输入提示词
   * @param messages 消息数组
   * @returns 格式化后的提示词
   */
  private formatInputPrompt(messages: Message[]): string {
    // 提取系统消息
    const systemMessages = messages.filter(m => m.role === 'system');
    const systemPrompt = systemMessages.map(m => m.content).join('\n\n');
    
    // 提取用户消息
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // 提取助手消息进行上下文构建
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    let contextBuilder = '';
    
    // 如果有对话历史，构建上下文
    if (userMessages.length > 1 || assistantMessages.length > 0) {
      // 交替添加用户和助手消息以构建对话历史
      let dialogIndex = 0;
      while (dialogIndex < userMessages.length - 1 || dialogIndex < assistantMessages.length) {
        if (dialogIndex < userMessages.length - 1) {
          contextBuilder += `用户: ${userMessages[dialogIndex].content}\n\n`;
        }
        
        if (dialogIndex < assistantMessages.length) {
          contextBuilder += `助手: ${assistantMessages[dialogIndex].content}\n\n`;
        }
        
        dialogIndex++;
      }
    }
    
    // 构建完整提示词
    let prompt = '';
    
    // 添加系统提示
    if (systemPrompt) {
      prompt += `${systemPrompt}\n\n`;
    }
    
    // 添加对话历史上下文
    if (contextBuilder) {
      prompt += `${contextBuilder}`;
    }
    
    // 添加当前用户问题
    prompt += `用户: ${lastUserMessage}\n\n助手: `;
    
    return prompt;
  }
}

// 创建并导出AI服务实例
const aiService = new AIService();
export default aiService; 