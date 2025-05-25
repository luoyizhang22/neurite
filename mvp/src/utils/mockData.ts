/**
 * 模拟数据生成工具
 * 
 * 用于开发和测试阶段，生成各种模拟数据
 */

import { nanoid } from 'nanoid';
import { 
  IGraph, 
  INode, 
  ITextNode, 
  IAINode, 
  IQuestionNode, 
  IAnswerNode, 
  IImageNode, 
  ILinkNode, 
  IEdge,
  IViewport
} from '../types/graph';

/**
 * 生成模拟图谱数据
 * @param count 生成的图谱数量
 * @returns 模拟图谱数据数组
 */
export function generateMockGraphs(count: number = 5): IGraph[] {
  const graphs: IGraph[] = [];
  
  for (let i = 0; i < count; i++) {
    const id = nanoid();
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    const updatedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // 生成节点和边
    const nodeCount = Math.floor(Math.random() * 15) + 5; // 5-20个节点
    const nodes = generateMockNodes(nodeCount);
    const edges = generateMockEdges(nodes);
    
    // 创建图谱
    graphs.push({
      id,
      title: `模拟图谱 ${i + 1}`,
      description: `这是一个用于测试的模拟图谱，包含${nodeCount}个节点和${edges.length}条边。`,
      createdAt,
      updatedAt,
      nodes,
      edges,
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      },
      starred: Math.random() > 0.7 // 30%的概率被标星
    });
  }
  
  return graphs;
}

/**
 * 生成模拟节点数据
 * @param count 生成的节点数量
 * @returns 模拟节点数据数组
 */
function generateMockNodes(count: number): INode[] {
  const nodes: INode[] = [];
  const nodeTypes = ['text', 'ai', 'question', 'answer', 'image', 'link'];
  
  for (let i = 0; i < count; i++) {
    const id = nanoid();
    const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)] as INode['type'];
    const position = {
      x: Math.floor(Math.random() * 1000) - 500,
      y: Math.floor(Math.random() * 600) - 300
    };
    
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    // 基本节点元数据
    const metadata = {
      createdAt,
      updatedAt,
      tags: generateRandomTags(),
      confidence: type === 'ai' ? Math.random() * 0.5 + 0.5 : undefined // AI节点有置信度
    };
    
    // 根据类型创建不同的节点
    let node: INode;
    
    switch (type) {
      case 'text':
        node = createMockTextNode(id, position, metadata);
        break;
      case 'ai':
        node = createMockAINode(id, position, metadata);
        break;
      case 'question':
        node = createMockQuestionNode(id, position, metadata);
        break;
      case 'answer':
        node = createMockAnswerNode(id, position, metadata);
        break;
      case 'image':
        node = createMockImageNode(id, position, metadata);
        break;
      case 'link':
        node = createMockLinkNode(id, position, metadata);
        break;
      default:
        node = createMockTextNode(id, position, metadata);
    }
    
    nodes.push(node);
  }
  
  return nodes;
}

/**
 * 生成模拟边数据
 * @param nodes 节点数组
 * @returns 模拟边数据数组
 */
function generateMockEdges(nodes: INode[]): IEdge[] {
  const edges: IEdge[] = [];
  const edgeTypes = ['direct', 'reference', 'question', 'answer'];
  
  // 确保每个节点至少有一条连接
  for (let i = 1; i < nodes.length; i++) {
    const source = nodes[i].id;
    const target = nodes[Math.floor(Math.random() * i)].id; // 连接到前面的某个节点
    const type = edgeTypes[Math.floor(Math.random() * edgeTypes.length)] as IEdge['type'];
    
    edges.push({
      id: nanoid(),
      source,
      target,
      type,
      label: type === 'reference' ? '参考' : undefined
    });
    
    // 更新节点的连接信息
    nodes[i].connectedTo = nodes[i].connectedTo || [];
    nodes[i].connectedTo.push(target);
  }
  
  // 随机添加一些额外的连接
  const extraEdgeCount = Math.floor(nodes.length * 0.5); // 额外添加约50%数量的边
  
  for (let i = 0; i < extraEdgeCount; i++) {
    const sourceIndex = Math.floor(Math.random() * nodes.length);
    let targetIndex;
    
    do {
      targetIndex = Math.floor(Math.random() * nodes.length);
    } while (targetIndex === sourceIndex);
    
    const source = nodes[sourceIndex].id;
    const target = nodes[targetIndex].id;
    const type = edgeTypes[Math.floor(Math.random() * edgeTypes.length)] as IEdge['type'];
    
    // 检查是否已存在相同的边
    const edgeExists = edges.some(edge => 
      (edge.source === source && edge.target === target) || 
      (edge.source === target && edge.target === source)
    );
    
    if (!edgeExists) {
      edges.push({
        id: nanoid(),
        source,
        target,
        type,
        label: type === 'reference' ? '参考' : undefined
      });
      
      // 更新节点的连接信息
      nodes[sourceIndex].connectedTo = nodes[sourceIndex].connectedTo || [];
      nodes[sourceIndex].connectedTo.push(target);
    }
  }
  
  return edges;
}

/**
 * 创建模拟文本节点
 */
function createMockTextNode(id: string, position: { x: number; y: number }, metadata: any): ITextNode {
  const formats = ['markdown', 'plain', 'bionic'];
  const format = formats[Math.floor(Math.random() * formats.length)] as 'markdown' | 'plain' | 'bionic';
  
  return {
    id,
    type: 'text',
    position,
    data: {
      content: generateLoremIpsum(Math.floor(Math.random() * 3) + 1),
      format,
      highlights: format !== 'bionic' ? generateRandomHighlights() : undefined
    },
    connectedTo: [],
    metadata
  };
}

/**
 * 创建模拟AI节点
 */
function createMockAINode(id: string, position: { x: number; y: number }, metadata: any): IAINode {
  const models = ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'];
  
  return {
    id,
    type: 'ai',
    position,
    data: {
      prompt: `请解释${generateRandomTopic()}的核心概念`,
      response: generateLoremIpsum(Math.floor(Math.random() * 2) + 2),
      model: models[Math.floor(Math.random() * models.length)],
      temperature: Math.random() * 0.7 + 0.3,
      contextNodes: []
    },
    connectedTo: [],
    metadata
  };
}

/**
 * 创建模拟问题节点
 */
function createMockQuestionNode(id: string, position: { x: number; y: number }, metadata: any): IQuestionNode {
  const formats = ['markdown', 'plain', 'bionic'];
  
  return {
    id,
    type: 'question',
    position,
    data: {
      content: `${generateRandomTopic()}的关键挑战是什么？`,
      format: formats[Math.floor(Math.random() * formats.length)] as 'markdown' | 'plain' | 'bionic',
      answerNodeIds: []
    },
    connectedTo: [],
    metadata
  };
}

/**
 * 创建模拟回答节点
 */
function createMockAnswerNode(id: string, position: { x: number; y: number }, metadata: any): IAnswerNode {
  const formats = ['markdown', 'plain', 'bionic'];
  
  return {
    id,
    type: 'answer',
    position,
    data: {
      content: generateLoremIpsum(1),
      format: formats[Math.floor(Math.random() * formats.length)] as 'markdown' | 'plain' | 'bionic',
      questionNodeId: '',
      sourceNodeIds: []
    },
    connectedTo: [],
    metadata
  };
}

/**
 * 创建模拟图像节点
 */
function createMockImageNode(id: string, position: { x: number; y: number }, metadata: any): IImageNode {
  const imageIds = [
    '1', '10', '100', '1000', '1001', '1002', '1003', '1004', '1005', '1006'
  ];
  const imageId = imageIds[Math.floor(Math.random() * imageIds.length)];
  
  return {
    id,
    type: 'image',
    position,
    data: {
      url: `https://picsum.photos/id/${imageId}/300/200`,
      alt: `随机图片 ${imageId}`,
      caption: Math.random() > 0.5 ? `这是一张随机生成的图片 #${imageId}` : undefined
    },
    connectedTo: [],
    metadata
  };
}

/**
 * 创建模拟链接节点
 */
function createMockLinkNode(id: string, position: { x: number; y: number }, metadata: any): ILinkNode {
  const websites = [
    { url: 'https://www.wikipedia.org', title: '维基百科', desc: '自由的百科全书' },
    { url: 'https://www.github.com', title: 'GitHub', desc: '全球最大的代码托管平台' },
    { url: 'https://www.youtube.com', title: 'YouTube', desc: '全球最大的视频分享平台' },
    { url: 'https://www.openai.com', title: 'OpenAI', desc: '人工智能研究实验室' },
    { url: 'https://www.arxiv.org', title: 'arXiv', desc: '科学论文预印本网站' }
  ];
  
  const website = websites[Math.floor(Math.random() * websites.length)];
  
  return {
    id,
    type: 'link',
    position,
    data: {
      url: website.url,
      title: website.title,
      description: website.desc,
      thumbnail: Math.random() > 0.5 ? `https://picsum.photos/seed/${id}/100/100` : undefined
    },
    connectedTo: [],
    metadata
  };
}

/**
 * 生成随机标签
 */
function generateRandomTags(): string[] {
  const allTags = [
    '学习', '研究', '笔记', '重要', '待办', '已完成', '参考',
    '科学', '技术', '艺术', '历史', '哲学', '数学', '物理',
    '计算机', '人工智能', '机器学习', '深度学习', '神经网络',
    '认知科学', '心理学', '社会学', '经济学', '政治学'
  ];
  
  const tagCount = Math.floor(Math.random() * 3); // 0-2个标签
  const tags: string[] = [];
  
  for (let i = 0; i < tagCount; i++) {
    const tag = allTags[Math.floor(Math.random() * allTags.length)];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
}

/**
 * 生成随机高亮
 */
function generateRandomHighlights(): { start: number; end: number; color: string }[] {
  if (Math.random() > 0.3) return []; // 70%的概率没有高亮
  
  const colors = ['yellow', 'green', 'blue', 'pink', 'purple'];
  const highlightCount = Math.floor(Math.random() * 2) + 1; // 1-2个高亮
  const highlights = [];
  
  for (let i = 0; i < highlightCount; i++) {
    const start = Math.floor(Math.random() * 50);
    const length = Math.floor(Math.random() * 20) + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    highlights.push({
      start,
      end: start + length,
      color
    });
  }
  
  return highlights;
}

/**
 * 生成随机主题
 */
function generateRandomTopic(): string {
  const topics = [
    '人工智能', '机器学习', '深度学习', '神经网络', '自然语言处理',
    '计算机视觉', '强化学习', '知识图谱', '认知科学', '脑科学',
    '量子计算', '区块链', '虚拟现实', '增强现实', '元宇宙',
    '生物信息学', '基因编辑', '纳米技术', '可再生能源', '气候变化'
  ];
  
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * 生成Lorem Ipsum文本
 * @param paragraphs 段落数量
 * @returns 生成的文本
 */
function generateLoremIpsum(paragraphs: number = 1): string {
  const loremIpsumText = [
    '人工智能是研究如何使计算机能够像人一样思考和学习的科学与工程。它涉及机器学习、自然语言处理、计算机视觉等多个领域，旨在创造能够模拟人类认知功能的智能系统。',
    '认知科学是研究思维和智能的跨学科领域，它整合了心理学、神经科学、语言学、人工智能、哲学和人类学的研究方法和理论。通过研究人类如何感知、思考、学习和记忆，认知科学家们试图理解智能的本质。',
    '知识图谱是一种语义网络，它以图形化的方式表示实体之间的关系和知识。它由节点（表示实体）和边（表示关系）组成，能够有效地组织和表示复杂的知识结构，支持智能搜索、推理和决策。',
    '非线性学习是一种不按预定顺序进行的学习方式，它允许学习者根据自己的兴趣、需求和理解水平自由探索知识。这种学习方式更符合人脑的自然工作方式，有助于建立更丰富、更有意义的知识连接。',
    '神经网络是一种受人脑结构启发的计算模型，由大量相互连接的人工神经元组成。它能够通过学习从数据中识别模式，并用于解决各种复杂问题，如图像识别、自然语言处理和决策制定。'
  ];
  
  const result = [];
  for (let i = 0; i < paragraphs; i++) {
    result.push(loremIpsumText[Math.floor(Math.random() * loremIpsumText.length)]);
  }
  
  return result.join('\n\n');
} 