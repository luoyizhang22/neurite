import { v4 as uuidv4 } from 'uuid';
import aiService, { Message, AIProvider } from './aiService';
import { INode, IAINode, ITextNode, IEdge, NodePosition } from '@types/graph';
import { AppDispatch } from '@store/index';
import { addNode, updateNode, addEdge } from '@store/slices/nodesSlice';

// 代理操作类型
export type AgentActionType = 
  | 'create_node' 
  | 'update_node' 
  | 'create_edge' 
  | 'analyze_nodes'
  | 'suggest_connections'
  | 'summarize_graph';

// 代理操作接口
export interface AgentAction {
  type: AgentActionType;
  payload: any;
}

// 代理选项接口
export interface AgentOptions {
  model: string;
  provider: AIProvider;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

// 节点生成选项
export interface NodeGenerationOptions {
  count?: number;
  nodeType?: 'text' | 'ai';
  basedOnNodeIds?: string[];
  topic?: string;
}

// 关系推断选项
export interface RelationInferenceOptions {
  nodeIds: string[];
  relationTypes?: string[];
  bidirectional?: boolean;
}

/**
 * AI代理服务
 * 提供AI驱动的节点生成、关系推断和图分析功能
 */
class AIAgentService {
  private dispatch: AppDispatch | null = null;
  private nodes: INode[] = [];
  private edges: IEdge[] = [];
  
  // 设置Redux dispatch
  public setDispatch(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }
  
  // 更新节点和边的缓存
  public updateState(nodes: INode[], edges: IEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }
  
  /**
   * 生成新节点
   * @param options 节点生成选项
   * @param agentOptions AI代理选项
   * @returns 生成的节点ID数组
   */
  public async generateNodes(
    options: NodeGenerationOptions,
    agentOptions: AgentOptions
  ): Promise<string[]> {
    if (!this.dispatch) {
      throw new Error('Dispatch not set. Call setDispatch before using agent actions.');
    }
    
    const { count = 1, nodeType = 'text', basedOnNodeIds = [], topic = '' } = options;
    
    // 构建上下文
    const contextNodes = this.nodes.filter(node => basedOnNodeIds.includes(node.id));
    const contextContent = contextNodes.map(node => {
      if (node.type === 'text') {
        return (node as ITextNode).data?.content || '';
      } else if (node.type === 'ai') {
        return `提示: ${(node as IAINode).data?.prompt || ''}\n回答: ${(node as IAINode).data?.response || ''}`;
      }
      return '';
    }).join('\n\n');
    
    // 构建系统提示
    const systemPrompt = agentOptions.systemPrompt || 
      `你是一个知识图谱助手，负责生成与给定主题或内容相关的节点。
      请基于提供的上下文和主题，生成${count}个相关的知识点。
      每个知识点应该是独立的，但与上下文或主题有明确的关联。
      生成的内容应该简洁、信息丰富且有见解。`;
    
    // 构建用户提示
    let userPrompt = '';
    if (contextContent) {
      userPrompt = `基于以下内容:\n\n${contextContent}\n\n`;
    }
    userPrompt += topic ? `请生成${count}个关于"${topic}"的相关知识点。` : 
      `请生成${count}个与上述内容相关的知识点。`;
    userPrompt += `\n\n以JSON数组格式返回结果，每个项目包含title和content字段。格式如下:
    [
      {
        "title": "知识点标题",
        "content": "知识点详细内容"
      }
    ]`;
    
    // 构建消息
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    try {
      // 发送请求
      const response = await aiService.sendRequest({
        model: agentOptions.model,
        messages,
        temperature: agentOptions.temperature || 0.7,
        maxTokens: agentOptions.maxTokens,
        provider: agentOptions.provider
      });
      
      // 解析响应
      let generatedNodes: { title: string; content: string }[] = [];
      try {
        // 尝试解析JSON
        const responseText = response.text.trim();
        const jsonStart = responseText.indexOf('[');
        const jsonEnd = responseText.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = responseText.substring(jsonStart, jsonEnd);
          generatedNodes = JSON.parse(jsonStr);
        } else {
          throw new Error('无法解析JSON响应');
        }
      } catch (error) {
        console.error('解析AI响应失败:', error);
        throw new Error('无法解析AI生成的节点数据');
      }
      
      // 创建节点
      const createdNodeIds: string[] = [];
      
      for (const nodeData of generatedNodes) {
        const nodeId = uuidv4();
        
        // 计算新节点位置
        const position = this.calculateNewNodePosition(basedOnNodeIds);
        
        if (nodeType === 'text') {
          // 创建文本节点
          const newNode: ITextNode = {
            id: nodeId,
            type: 'text',
            position,
            data: {
              content: `# ${nodeData.title}\n\n${nodeData.content}`,
              format: 'markdown'
            }
          };
          
          this.dispatch(addNode(newNode));
          createdNodeIds.push(nodeId);
        } else if (nodeType === 'ai') {
          // 创建AI节点
          const newNode: IAINode = {
            id: nodeId,
            type: 'ai',
            position,
            data: {
              prompt: nodeData.title,
              response: nodeData.content,
              model: agentOptions.model,
              temperature: agentOptions.temperature || 0.7,
              contextNodes: basedOnNodeIds
            }
          };
          
          this.dispatch(addNode(newNode));
          createdNodeIds.push(nodeId);
        }
      }
      
      // 如果有基于的节点，创建连接
      if (basedOnNodeIds.length > 0 && createdNodeIds.length > 0) {
        for (const sourceId of basedOnNodeIds) {
          for (const targetId of createdNodeIds) {
            const edgeId = `edge-${sourceId}-${targetId}`;
            this.dispatch(addEdge({
              id: edgeId,
              source: sourceId,
              target: targetId,
              label: '关联'
            }));
          }
        }
      }
      
      return createdNodeIds;
    } catch (error) {
      console.error('生成节点失败:', error);
      throw error;
    }
  }
  
  /**
   * 推断节点间的关系
   * @param options 关系推断选项
   * @param agentOptions AI代理选项
   * @returns 创建的边ID数组
   */
  public async inferRelations(
    options: RelationInferenceOptions,
    agentOptions: AgentOptions
  ): Promise<string[]> {
    if (!this.dispatch) {
      throw new Error('Dispatch not set. Call setDispatch before using agent actions.');
    }
    
    const { nodeIds, relationTypes = [], bidirectional = false } = options;
    
    if (nodeIds.length < 2) {
      throw new Error('需要至少两个节点来推断关系');
    }
    
    // 获取节点内容
    const nodesData = nodeIds.map(id => {
      const node = this.nodes.find(n => n.id === id);
      if (!node) return { id, content: '' };
      
      let content = '';
      if (node.type === 'text') {
        content = (node as ITextNode).data?.content || '';
      } else if (node.type === 'ai') {
        content = `提示: ${(node as IAINode).data?.prompt || ''}\n回答: ${(node as IAINode).data?.response || ''}`;
      }
      
      return { id, content };
    });
    
    // 构建系统提示
    const systemPrompt = agentOptions.systemPrompt || 
      `你是一个知识图谱分析助手，负责分析节点之间的关系。
      请分析提供的节点内容，推断它们之间可能存在的关系。
      关系应该是有向的，从一个节点指向另一个节点，表示它们之间的逻辑关联。
      ${relationTypes.length > 0 ? `请使用以下关系类型之一: ${relationTypes.join(', ')}` : '请为关系提供一个简短的描述性标签。'}`;
    
    // 构建用户提示
    const userPrompt = `请分析以下节点之间的关系:\n\n${
      nodesData.map((node, index) => `节点 ${index + 1} (ID: ${node.id}):\n${node.content}`).join('\n\n')
    }\n\n请以JSON数组格式返回节点之间的关系，每个关系包含source(源节点ID)、target(目标节点ID)和label(关系标签)字段。格式如下:
    [
      {
        "source": "节点ID",
        "target": "节点ID",
        "label": "关系标签"
      }
    ]`;
    
    // 构建消息
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    try {
      // 发送请求
      const response = await aiService.sendRequest({
        model: agentOptions.model,
        messages,
        temperature: agentOptions.temperature || 0.5,
        maxTokens: agentOptions.maxTokens,
        provider: agentOptions.provider
      });
      
      // 解析响应
      let inferredRelations: { source: string; target: string; label: string }[] = [];
      try {
        // 尝试解析JSON
        const responseText = response.text.trim();
        const jsonStart = responseText.indexOf('[');
        const jsonEnd = responseText.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = responseText.substring(jsonStart, jsonEnd);
          inferredRelations = JSON.parse(jsonStr);
        } else {
          throw new Error('无法解析JSON响应');
        }
      } catch (error) {
        console.error('解析AI响应失败:', error);
        throw new Error('无法解析AI推断的关系数据');
      }
      
      // 创建边
      const createdEdgeIds: string[] = [];
      
      for (const relation of inferredRelations) {
        // 验证源节点和目标节点存在
        const sourceExists = this.nodes.some(n => n.id === relation.source);
        const targetExists = this.nodes.some(n => n.id === relation.target);
        
        if (!sourceExists || !targetExists) {
          console.warn(`跳过无效关系: ${relation.source} -> ${relation.target}`);
          continue;
        }
        
        // 检查边是否已存在
        const edgeExists = this.edges.some(e => 
          e.source === relation.source && e.target === relation.target
        );
        
        if (!edgeExists) {
          const edgeId = `edge-${relation.source}-${relation.target}`;
          this.dispatch(addEdge({
            id: edgeId,
            source: relation.source,
            target: relation.target,
            label: relation.label
          }));
          createdEdgeIds.push(edgeId);
        }
        
        // 如果是双向关系，添加反向边
        if (bidirectional) {
          const reverseEdgeExists = this.edges.some(e => 
            e.source === relation.target && e.target === relation.source
          );
          
          if (!reverseEdgeExists) {
            const reverseEdgeId = `edge-${relation.target}-${relation.source}`;
            this.dispatch(addEdge({
              id: reverseEdgeId,
              source: relation.target,
              target: relation.source,
              label: relation.label
            }));
            createdEdgeIds.push(reverseEdgeId);
          }
        }
      }
      
      return createdEdgeIds;
    } catch (error) {
      console.error('推断关系失败:', error);
      throw error;
    }
  }
  
  /**
   * 分析图中的节点并提供见解
   * @param nodeIds 要分析的节点ID数组
   * @param agentOptions AI代理选项
   * @returns 分析结果
   */
  public async analyzeNodes(
    nodeIds: string[],
    agentOptions: AgentOptions
  ): Promise<string> {
    // 获取节点内容
    const nodesData = nodeIds.map(id => {
      const node = this.nodes.find(n => n.id === id);
      if (!node) return { id, content: '' };
      
      let content = '';
      if (node.type === 'text') {
        content = (node as ITextNode).data?.content || '';
      } else if (node.type === 'ai') {
        content = `提示: ${(node as IAINode).data?.prompt || ''}\n回答: ${(node as IAINode).data?.response || ''}`;
      }
      
      return { id, content };
    });
    
    // 构建系统提示
    const systemPrompt = agentOptions.systemPrompt || 
      `你是一个知识图谱分析助手，负责分析多个节点的内容并提供见解。
      请分析提供的节点内容，找出关键主题、模式和关系。
      提供对内容的综合分析，包括主要观点、潜在的知识缺口和可能的扩展方向。`;
    
    // 构建用户提示
    const userPrompt = `请分析以下节点内容:\n\n${
      nodesData.map((node, index) => `节点 ${index + 1} (ID: ${node.id}):\n${node.content}`).join('\n\n')
    }\n\n请提供一个综合分析，包括:
    1. 主要主题和观点
    2. 节点之间的关系和模式
    3. 潜在的知识缺口
    4. 可能的扩展方向和建议`;
    
    // 构建消息
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    try {
      // 发送请求
      const response = await aiService.sendRequest({
        model: agentOptions.model,
        messages,
        temperature: agentOptions.temperature || 0.3,
        maxTokens: agentOptions.maxTokens,
        provider: agentOptions.provider
      });
      
      return response.text;
    } catch (error) {
      console.error('分析节点失败:', error);
      throw error;
    }
  }
  
  /**
   * 计算新节点的位置
   * @param baseNodeIds 基础节点ID数组
   * @returns 新节点位置
   */
  private calculateNewNodePosition(baseNodeIds: string[]): NodePosition {
    // 默认位置
    let x = 100;
    let y = 100;
    
    if (baseNodeIds.length > 0) {
      // 计算基础节点的平均位置
      let totalX = 0;
      let totalY = 0;
      let count = 0;
      
      for (const id of baseNodeIds) {
        const node = this.nodes.find(n => n.id === id);
        if (node && node.position) {
          totalX += node.position.x;
          totalY += node.position.y;
          count++;
        }
      }
      
      if (count > 0) {
        // 在平均位置的右下方添加一些偏移
        x = (totalX / count) + 200 + Math.random() * 100;
        y = (totalY / count) + 100 + Math.random() * 100;
      }
    } else if (this.nodes.length > 0) {
      // 如果没有基础节点但有其他节点，避免重叠
      x = Math.max(...this.nodes.map(n => n.position?.x || 0)) + 300;
      y = 100 + Math.random() * 200;
    }
    
    return { x, y };
  }
}

// 创建并导出AI代理服务实例
const aiAgentService = new AIAgentService();
export default aiAgentService; 