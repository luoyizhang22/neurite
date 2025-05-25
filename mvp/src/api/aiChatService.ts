import aiService, { Message, AIProvider } from './aiService';

// 聊天上下文接口
export interface ChatContext {
  threadId?: string;
  messages: Message[];
  selectedNodes?: string[];
  model: string;
  provider: AIProvider;
  temperature?: number;
}

// 查询选项
export interface QueryOptions {
  model: string;
  provider: AIProvider;
  temperature?: number;
  systemPrompt?: string;
  maxTokens?: number;
}

class AIChatService {
  private activeChats: Map<string, ChatContext> = new Map();
  
  // 创建新的聊天上下文
  public createChat(threadId?: string): string {
    const id = threadId || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.activeChats.set(id, {
      threadId: id,
      messages: [],
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      temperature: 0.7
    });
    return id;
  }
  
  // 获取聊天上下文
  public getChat(threadId: string): ChatContext | undefined {
    return this.activeChats.get(threadId);
  }
  
  // 更新聊天上下文
  public updateChat(threadId: string, updates: Partial<ChatContext>): void {
    const chat = this.activeChats.get(threadId);
    if (chat) {
      this.activeChats.set(threadId, { ...chat, ...updates });
    }
  }
  
  // 发送消息到聊天
  public async sendMessage(
    threadId: string, 
    content: string
  ): Promise<{ text: string; requestId: string }> {
    const chat = this.activeChats.get(threadId);
    if (!chat) {
      throw new Error(`Chat thread ${threadId} not found`);
    }
    
    // 添加用户消息到历史
    const userMessage: Message = {
      role: 'user',
      content
    };
    
    chat.messages.push(userMessage);
    
    // 发送请求到AI
    const response = await aiService.sendRequest({
      model: chat.model,
      messages: chat.messages,
      temperature: chat.temperature,
      provider: chat.provider
    });
    
    // 添加AI回复到历史
    const assistantMessage: Message = {
      role: 'assistant',
      content: response.text
    };
    
    chat.messages.push(assistantMessage);
    this.activeChats.set(threadId, chat);
    
    return {
      text: response.text,
      requestId: response.requestId
    };
  }
  
  // 清除聊天历史
  public clearChatHistory(threadId: string): void {
    const chat = this.activeChats.get(threadId);
    if (chat) {
      chat.messages = [];
      this.activeChats.set(threadId, chat);
    }
  }
  
  // 删除聊天
  public deleteChat(threadId: string): void {
    this.activeChats.delete(threadId);
  }
  
  // 基于多个节点内容进行查询
  public async queryWithNodes(
    nodesContent: string[], 
    userQuery: string,
    options: QueryOptions
  ): Promise<string> {
    // 构建系统提示
    const systemPrompt = options.systemPrompt || 
      '你是一个知识助手，请基于提供的内容回答用户的问题。分析多个节点的内容，找出关键信息，并给出综合性的回答。';
    
    // 构建上下文
    const contextMessages: Message[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // 添加节点内容作为上下文
    nodesContent.forEach((content, index) => {
      contextMessages.push({
        role: 'user',
        content: `节点 ${index + 1} 内容:\n${content}`
      });
    });
    
    // 添加用户查询
    contextMessages.push({
      role: 'user',
      content: userQuery
    });
    
    // 发送请求
    const response = await aiService.sendRequest({
      model: options.model,
      messages: contextMessages,
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens,
      provider: options.provider
    });
    
    return response.text;
  }
  
  // 生成节点摘要
  public async generateNodeSummary(
    nodeContent: string,
    options: QueryOptions
  ): Promise<string> {
    const systemPrompt = '分析以下内容并生成一个简明扼要的摘要，突出主要观点和关键信息。';
    
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: nodeContent }
    ];
    
    const response = await aiService.sendRequest({
      model: options.model,
      messages,
      temperature: options.temperature || 0.3,
      maxTokens: 200,
      provider: options.provider
    });
    
    return response.text;
  }
  
  // 比较多个节点内容
  public async compareNodes(
    nodesContent: string[],
    options: QueryOptions
  ): Promise<string> {
    const systemPrompt = '分析以下多个节点的内容，比较它们的异同点，并提供一个综合性的比较结果。';
    
    const messages: Message[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // 添加节点内容
    nodesContent.forEach((content, index) => {
      messages.push({
        role: 'user',
        content: `节点 ${index + 1} 内容:\n${content}`
      });
    });
    
    // 添加比较请求
    messages.push({
      role: 'user',
      content: '请比较以上节点内容的异同点，并提供一个综合性的比较结果。'
    });
    
    const response = await aiService.sendRequest({
      model: options.model,
      messages,
      temperature: options.temperature || 0.3,
      provider: options.provider
    });
    
    return response.text;
  }
  
  // 生成思维导图
  public async generateMindMap(
    nodesContent: string[],
    options: QueryOptions
  ): Promise<string> {
    const systemPrompt = '基于以下内容，生成一个结构化的思维导图大纲，包括主题、子主题和关键点。';
    
    const combinedContent = nodesContent.join('\n\n');
    
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `${combinedContent}\n\n请基于以上内容，生成一个结构化的思维导图大纲，包括主题、子主题和关键点。使用Markdown格式的列表结构表示层级关系。` 
      }
    ];
    
    const response = await aiService.sendRequest({
      model: options.model,
      messages,
      temperature: options.temperature || 0.3,
      provider: options.provider
    });
    
    return response.text;
  }
}

// 创建并导出AI聊天服务实例
const aiChatService = new AIChatService();
export default aiChatService; 