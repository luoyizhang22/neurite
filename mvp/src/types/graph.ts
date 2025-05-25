/**
 * 定义图谱和节点相关的类型
 */

// 基本节点类型
export interface INode {
  id: string;
  type: 'text' | 'image' | 'link' | 'ai' | 'question' | 'answer' | 'debate' | 'port' | 'aiagent';
  position: { x: number; y: number };
  data: any;
  connectedTo: string[]; // 关联节点ID
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    confidence?: number; // AI生成内容的置信度
  };
}

// 文本节点类型
export interface ITextNode extends INode {
  type: 'text';
  data: {
    content: string;
    format: 'markdown' | 'plain' | 'bionic';
    highlights?: { start: number; end: number; color: string }[];
  };
}

// AI节点数据接口
export interface IAINodeData {
  prompt: string;
  response?: string;
  model?: string;
  temperature?: number;
  contextNodes?: string[];
  error?: string;
}

// AI节点接口
export interface IAINode extends INode {
  type: 'ai';
  data: IAINodeData;
}

// 问题节点类型
export interface IQuestionNode extends INode {
  type: 'question';
  data: {
    content: string;
    format: 'markdown' | 'plain' | 'bionic';
    answerNodeIds: string[]; // 关联的回答节点ID
  };
}

// 回答节点类型
export interface IAnswerNode extends INode {
  type: 'answer';
  data: {
    content: string;
    format: 'markdown' | 'plain' | 'bionic';
    questionNodeId: string; // 关联的问题节点ID
    sourceNodeIds: string[]; // 来源节点ID
  };
}

// 图像节点类型
export interface IImageNode extends INode {
  type: 'image';
  data: {
    url: string;
    alt: string;
    caption?: string;
  };
}

// 链接节点类型
export interface ILinkNode extends INode {
  type: 'link';
  data: {
    url: string;
    title: string;
    description?: string;
    thumbnail?: string;
  };
}

// 辩论节点类型
export interface IDebateNode extends INode {
  type: 'debate';
  data: {
    topic: string;            // 讨论话题
    perspectives: string[];   // 多个观点
    analysis: string;         // 辩论分析内容
    persuasiveView: string;   // 最具说服力的观点
    settings?: {              // 生成设置
      debateStyle: 'balanced' | 'adversarial' | 'socratic';
      complexity: number;     // 思考复杂度 1-5
      model: string;          // 使用的AI模型
    };
    sourceNodeId?: string;    // 来源节点ID
  };
}

// 边类型（连接线）
export interface IEdge {
  id: string;
  source: string; // 源节点ID
  target: string; // 目标节点ID
  type: 'direct' | 'reference' | 'question' | 'answer' | 'debate' | 'cause' | 'effect' | 'support' | 'oppose' | 'similar' | 'different' | 'extends' | 'includes';
  label?: string;
  style?: {
    strokeWidth?: number;
    strokeColor?: string;
    strokeDashArray?: string;
    animated?: boolean;
  };
  data?: {
    description?: string;
    strength?: number; // 关系强度 1-5
    bidirectional?: boolean; // 是否为双向关系
    createdAt?: Date;
    createdBy?: 'user' | 'ai';
  };
}

// 视口类型，表示图谱视图状态
export interface IViewport {
  x: number;
  y: number;
  zoom: number;
}

// 图谱类型
export interface IGraph {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: INode[];
  edges: IEdge[];
  viewport: IViewport;
  starred?: boolean;
}

// 知识树分支接口
export interface IKnowledgeBranch {
  id: string;
  name: string;
  description: string;
  category: 'history' | 'natural_science' | 'human_science' | 'philosophy' | 'arts';
  children: IKnowledgeBranch[];
  parentId?: string;
  collapsed: boolean;
  relatedNodes?: string[]; // 与该分类关联的节点ID列表
}

// 知识树接口
export interface IKnowledgeTree {
  id: string;
  name: string;
  root: IKnowledgeBranch;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  ownerId?: string;
}

// 端口类型定义
export interface IPort {
  id: string;
  name: string;
  type: 'data' | 'control' | 'reference';
  direction: 'input' | 'output';
  description?: string;
  dataType?: 'text' | 'number' | 'boolean' | 'object' | 'any';
  connections: string[]; // 连接到的其他端口ID
  position?: { x: number; y: number }; // 相对于节点的位置
}

// 端口节点类型 (类似Simulink的模块)
export interface IPortNode extends INode {
  type: 'port';
  data: {
    title: string;
    description: string;
    content: string;
    inputs: IPort[];  // 输入端口
    outputs: IPort[]; // 输出端口
    process: string;  // 处理逻辑描述
    format: 'markdown' | 'plain' | 'bionic';
  };
}

// AI代理节点数据接口
export interface IAIAgentNodeData {
  mode?: 'generate' | 'connect' | 'analyze';
  result?: string;
  selectedNodeIds?: string[];
  generationOptions?: {
    count?: number;
    nodeType?: 'text' | 'ai';
    topic?: string;
  };
  relationOptions?: {
    relationTypes?: string[];
    bidirectional?: boolean;
  };
  agentOptions?: {
    provider?: string;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
  };
}

// AI代理节点接口
export interface IAIAgentNode extends INode {
  type: 'aiagent';
  data: IAIAgentNodeData;
} 