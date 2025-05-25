/**
 * ContentExtractor.ts
 * 增强的内容提取器，用于从不同类型的节点中提取内容
 */

import { INode, ITextNode, IImageNode, IAINode, IDebateNode, ILinkNode, IPortNode } from '../types/graph';

export interface ExtractedContent {
  text: string;          // 提取的文本内容
  type: string;          // 节点类型
  title?: string;        // 节点标题或名称
  imageUrl?: string;     // 图片URL（如果有）
  sourceUrl?: string;    // 源链接（如果有）
  metadata?: Record<string, any>; // 其他元数据
  originalNode: INode;   // 原始节点引用
}

/**
 * 内容提取器类
 * 负责从不同类型的节点中提取结构化内容
 */
export class ContentExtractor {
  /**
   * 从节点中提取内容
   * @param node 要提取内容的节点
   * @returns 提取的结构化内容
   */
  public static extractContent(node: INode): ExtractedContent {
    // 检查节点是否有效
    if (!node) {
      console.error('尝试从无效节点提取内容');
      return {
        text: '无效节点',
        type: '未知类型',
        originalNode: {} as INode
      };
    }

    console.log(`开始提取节点内容: ID=${node.id}, 类型=${node.type}`, {
      node简述: {
        id: node.id,
        type: node.type,
        hasData: !!node.data,
        hasContent: !!node.content,
        dataKeys: node.data ? Object.keys(node.data) : []
      }
    });
    
    // 基本内容结构
    const content: ExtractedContent = {
      text: '',
      type: node.type || '未知类型',
      originalNode: node
    };

    try {
      // 根据节点类型提取不同的内容
      switch (node.type) {
        case 'text':
          return this.extractTextNodeContent(node as ITextNode);
        
        case 'image':
          return this.extractImageNodeContent(node as IImageNode);
        
        case 'ai':
          return this.extractAINodeContent(node as IAINode);
        
        case 'debate':
          return this.extractDebateNodeContent(node as IDebateNode);
        
        case 'link':
          return this.extractLinkNodeContent(node as ILinkNode);
        
        case 'port':
          return this.extractPortNodeContent(node as IPortNode);
        
        case 'question':
        case 'answer':
          return this.extractQuestionAnswerNodeContent(node);
        
        default:
          // 对于未知类型，尝试从各种可能的位置提取内容
          let extractedText = '';
          
          // Check node.data.content
          if (node.data?.content && typeof node.data.content === 'string') {
            extractedText = node.data.content;
            console.log(`Extracted content from data.content: ${extractedText.substring(0, 50)}...`);
          } 
          // Check node.content
          else if (node.content && typeof node.content === 'string') {
            extractedText = node.content;
            console.log(`Extracted content from node.content: ${extractedText.substring(0, 50)}...`);
          }
          // Check other fields in data
          else if (node.data) {
            const possibleContentFields = ['text', 'body', 'value', 'description', 'note'];
            
            for (const field of possibleContentFields) {
              if (node.data[field] && typeof node.data[field] === 'string') {
                extractedText = node.data[field];
                console.log(`Extracted content from data.${field}: ${extractedText.substring(0, 50)}...`);
                break;
              }
            }
            
            // If no content found above, convert entire data object
            if (!extractedText && Object.keys(node.data).length > 0) {
              try {
                extractedText = JSON.stringify(node.data);
                console.log(`Extracted content from data object: ${extractedText.substring(0, 50)}...`);
              } catch (e) {
                console.error('Failed to convert data object to string:', e);
              }
            }
          }
          
          // If still no content
          if (!extractedText || extractedText.trim() === '') {
            extractedText = 'Unable to extract content from this node';
            console.warn(`Could not extract content from node ${node.id}`);
          }
          
          content.text = extractedText;
          content.title = this.extractTitle(extractedText);
          
          return content;
      }
    } catch (error) {
      console.error(`提取节点 ${node.id} 内容时出错:`, error);
      
      // 返回错误信息
      content.text = `提取内容出错: ${error instanceof Error ? error.message : '未知错误'}`;
      content.title = '内容提取错误';
      
      return content;
    }
  }

  /**
   * 从任何对象中尝试提取文本内容，添加深度限制和智能内容合并
   * @param obj 可能包含内容的对象
   * @param depth 当前递归深度
   * @param maxDepth 最大递归深度
   * @param path 当前递归路径，用于调试
   * @returns 提取的文本或空字符串
   */
  private static extractTextFromAny(obj: any, depth = 0, maxDepth = 10, path = 'root'): string {
    // Basic check
    if (!obj) return '';
    
    // Depth check
    if (depth > maxDepth) {
      console.warn(`Recursion depth exceeds limit (${maxDepth}), path: ${path}`);
      return `[Content too deep: ${path}]`;
    }
    
    // 如果是字符串，直接返回
    if (typeof obj === 'string') return obj;
    
    // 如果是数字或布尔值，转换为字符串
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }
    
    // 如果是对象，按优先级检查可能的内容字段
    if (typeof obj === 'object' && obj !== null) {
      // 检测循环引用
      try {
        JSON.stringify(obj);
      } catch (e) {
        console.warn(`检测到循环引用，路径: ${path}`);
        return '[循环引用内容]';
      }
      
      // 按照常见的字段名称优先级尝试提取
      const contentFields = [
        'content', 'text', 'body', 'description', 'value', 'data', 'message',
        'title', 'name', 'label', 'summary', 'info', 'details'
      ];
      
      // 首先尝试直接从内容字段提取
      for (const field of contentFields) {
        if (obj[field]) {
          if (typeof obj[field] === 'string') {
            return obj[field];
          }
        }
      }
      
      // 如果是数组，智能合并所有内容
      if (Array.isArray(obj)) {
        // 过滤掉空值，并限制数组处理大小以防止过大的数组
        const maxArrayItems = 50;
        const limitedArray = obj.slice(0, maxArrayItems);
        
        if (limitedArray.length > 0) {
          // 检查是否所有元素都是简单类型
          const allSimpleTypes = limitedArray.every(
            item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
          );
          
          if (allSimpleTypes) {
            // 简单类型直接合并
            return limitedArray.join(', ');
          } else {
            // 复杂类型递归提取并合并
            const texts = limitedArray
              .map((item, i) => this.extractTextFromAny(item, depth + 1, maxDepth, `${path}[${i}]`))
              .filter(text => text && text.trim() !== '');
              
            if (texts.length > 0) {
              // 如果数组元素提取出的文本很短，用逗号分隔；否则用换行符
              const avgLength = texts.reduce((sum, text) => sum + text.length, 0) / texts.length;
              const separator = avgLength < 50 ? ', ' : '\n\n';
              return texts.join(separator);
            }
          }
        }
        
        if (obj.length > maxArrayItems) {
          return `${limitedArray.length}个项目已处理，${obj.length - maxArrayItems}个项目被省略...`;
        }
        
        return '';
      }
      
      // 递归检查内容字段
      for (const field of contentFields) {
        if (obj[field] && typeof obj[field] === 'object') {
          const extracted = this.extractTextFromAny(
            obj[field], 
            depth + 1, 
            maxDepth, 
            `${path}.${field}`
          );
          if (extracted) return extracted;
        }
      }
      
      // 收集所有可能的文本内容
      const textContents: string[] = [];
      
      // 遍历所有字段，收集文本内容
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          
          // 跳过函数和undefined
          if (typeof value === 'function' || value === undefined) {
            continue;
          }
          
          // 收集字符串字段
          if (typeof value === 'string' && value.length > 3) {
            textContents.push(value);
          } 
          // 递归处理对象字段
          else if (typeof value === 'object' && value !== null) {
            const extracted = this.extractTextFromAny(
              value, 
              depth + 1, 
              maxDepth, 
              `${path}.${key}`
            );
            if (extracted) textContents.push(extracted);
          }
        }
      }
      
      // 如果收集到多个文本内容，智能合并
      if (textContents.length > 0) {
        // 过滤掉太短的内容
        const significantTexts = textContents.filter(text => text.length > 10);
        
        if (significantTexts.length > 0) {
          // 如果只有一个有意义的文本，直接返回
          if (significantTexts.length === 1) {
            return significantTexts[0];
          }
          
          // 否则合并所有文本，使用适当的分隔符
          return significantTexts.join('\n\n');
        } else {
          // 如果没有足够长的文本，返回所有文本的合并
          return textContents.join(' ');
        }
      }
      
      // 尝试转换为字符串作为最后的手段
      try {
        const jsonString = JSON.stringify(obj);
        if (jsonString && jsonString !== '{}' && jsonString !== '[]') {
          // 如果JSON字符串太长，只返回摘要
          if (jsonString.length > 500) {
            return `[复杂对象: 包含${Object.keys(obj).length}个字段]`;
          }
          return jsonString;
        }
      } catch (e) {
        console.warn(`无法序列化对象，路径: ${path}`, e);
        return '[无法序列化的内容]';
      }
    }
    
    return '';
  }

  /**
   * 提取文本节点内容 - 增强版
   */
  private static extractTextNodeContent(node: ITextNode): ExtractedContent {
    console.log(`提取文本节点内容 ID=${node.id}`, {
      nodeData: node.data, 
      nodeContent: node.content,
      nodeType: node.type
    });
    
    // 使用统一的提取方法
    let content = '';
    
    // 尝试从各个可能的位置提取
    const possibleSources = [
      node.data?.content,           // 首选
      node.content,                 // 其次
      node.data,                    // 再次
      node                          // 最后
    ];
    
    // 尝试每个可能的来源
    for (const source of possibleSources) {
      if (!content) {
        content = this.extractTextFromAny(source);
        if (content) {
          console.log(`从来源 ${source === node.data?.content ? 'data.content' : 
                      source === node.content ? 'node.content' : 
                      source === node.data ? 'node.data' : 'node'} 提取到内容`);
          break;
        }
      }
    }
    
    // 如果仍然没有内容，记录一个警告
    if (!content || content.trim() === '') {
      console.warn(`警告：节点 ${node.id} 未提取到内容，使用默认值`);
      content = '节点内容为空';
    } else {
      console.log(`成功提取文本节点内容，长度: ${content.length}字符`);
    }

    return {
      text: content,
      type: '文本',
      title: this.extractTitle(content),
      metadata: {
        format: node.data?.format || 'plain',
        highlights: node.data?.highlights || []
      },
      originalNode: node
    };
  }

  /**
   * 提取图像节点内容
   */
  private static extractImageNodeContent(node: IImageNode): ExtractedContent {
    return {
      text: node.data?.caption || node.data?.alt || '图片',
      type: '图片',
      title: node.data?.alt || '图片',
      imageUrl: node.data?.url || '',
      metadata: {
        alt: node.data?.alt || '',
        caption: node.data?.caption || ''
      },
      originalNode: node
    };
  }

  /**
   * 提取AI节点内容 - 增强版
   */
  private static extractAINodeContent(node: IAINode): ExtractedContent {
    console.log(`提取AI节点内容 ID=${node.id}`);
    
    let text = '';
    
    // 尝试提取对话内容
    if (node.data?.prompt && node.data?.response) {
      // 如果有明确的问答结构，优先使用
      text = `问题: ${node.data.prompt}\n\n回答: ${node.data.response}`;
      console.log('从prompt/response对中提取AI内容');
    } 
    // 检查消息数组
    else if (node.data?.messages && Array.isArray(node.data.messages)) {
      // 如果有消息数组，提取对话历史
      text = node.data.messages.map(msg => 
        `${msg.role === 'user' ? '问题' : 
          msg.role === 'system' ? '系统' : '回答'}: ${msg.content}`
      ).join('\n\n');
      console.log('从messages数组提取AI内容');
    }
    // 尝试从其他字段提取
    else {
      // 使用通用提取方法
      const extractedText = this.extractTextFromAny(node.data || node);
      if (extractedText) {
        text = extractedText;
        console.log('使用通用提取方法从AI节点提取内容');
      }
    }
    
    // 如果没有内容，使用默认值
    if (!text || text.trim() === '') {
      console.warn(`警告: AI节点 ${node.id} 未提取到内容，使用默认值`);
      text = 'AI对话内容为空';
    } else {
      console.log(`成功提取AI节点内容，长度: ${text.length}字符`);
    }

    return {
      text: text,
      type: 'AI对话',
      title: node.data?.prompt ? this.extractTitle(node.data.prompt) : '对话',
      metadata: {
        prompt: node.data?.prompt || '',
        model: node.data?.model || '',
        temperature: node.data?.temperature || 0.7,
        contextNodes: node.data?.contextNodes || []
      },
      originalNode: node
    };
  }

  /**
   * 提取辩论节点内容 - 增强版
   */
  private static extractDebateNodeContent(node: IDebateNode): ExtractedContent {
    console.log(`Extracting debate node content ID=${node.id}`);
    
    let text = '';
    let topic = '';
    let analysis = '';
    let perspectives: string[] = [];
    
    // Try to extract key data
    if (node.data) {
      topic = node.data.topic || '';
      analysis = node.data.analysis || '';
      
      // Extract perspectives list
      if (node.data.perspectives && Array.isArray(node.data.perspectives)) {
        perspectives = node.data.perspectives;
      }
    }
    
    // Build complete text
    if (topic) {
      text += `Topic: ${topic}\n\n`;
    }
    
    if (perspectives.length > 0) {
      text += `Perspectives:\n`;
      perspectives.forEach((perspective, index) => {
        text += `${index + 1}. ${perspective}\n`;
      });
      text += '\n';
    }
    
    if (analysis) {
      text += `Analysis:\n${analysis}`;
    }
    
    // If no content extracted above, use generic extraction method
    if (!text || text.trim() === '') {
      const extractedText = this.extractTextFromAny(node.data || node);
      if (extractedText) {
        text = extractedText;
        console.log('Using generic extraction method for debate node content');
      }
    }
    
    // If still no content, use default value
    if (!text || text.trim() === '') {
      console.warn(`Warning: Debate node ${node.id} has no extracted content, using default value`);
      text = 'Debate content is empty';
    } else {
      console.log(`Successfully extracted debate node content, length: ${text.length} characters`);
    }

    return {
      text: text,
      type: 'Debate',
      title: topic || 'Debate',
      metadata: {
        perspectives: perspectives,
        persuasiveView: node.data?.persuasiveView || '',
        settings: node.data?.settings || {}
      },
      originalNode: node
    };
  }

  /**
   * 提取链接节点内容
   */
  private static extractLinkNodeContent(node: ILinkNode): ExtractedContent {
    return {
      text: `${node.data?.title || ''}\n${node.data?.description || ''}`,
      type: '链接',
      title: node.data?.title || '链接',
      sourceUrl: node.data?.url || '',
      metadata: {
        thumbnail: node.data?.thumbnail || ''
      },
      originalNode: node
    };
  }

  /**
   * 提取端口节点内容
   */
  private static extractPortNodeContent(node: IPortNode): ExtractedContent {
    return {
      text: node.data?.content || '',
      type: '端口节点',
      title: node.data?.title || '端口节点',
      metadata: {
        description: node.data?.description || '',
        inputs: node.data?.inputs || [],
        outputs: node.data?.outputs || [],
        process: node.data?.process || ''
      },
      originalNode: node
    };
  }

  /**
   * 提取问答节点内容
   */
  private static extractQuestionAnswerNodeContent(node: INode): ExtractedContent {
    const isQuestion = node.type === 'question';
    return {
      text: node.data?.content || '',
      type: isQuestion ? '问题' : '回答',
      title: this.extractTitle(node.data?.content || ''),
      metadata: {
        format: node.data?.format || 'plain',
        relatedNodeIds: isQuestion ? (node.data?.answerNodeIds || []) : (node.data?.questionNodeId ? [node.data.questionNodeId] : [])
      },
      originalNode: node
    };
  }

  /**
   * 从文本中提取标题（取第一行或前30个字符）
   */
  private static extractTitle(text: string): string {
    if (!text) return '';
    
    // 尝试获取第一行作为标题
    const firstLine = text.split('\n')[0].trim();
    if (firstLine && firstLine.length <= 50) {
      return firstLine;
    }
    
    // 否则取前30个字符
    return text.substring(0, 30) + (text.length > 30 ? '...' : '');
  }

  /**
   * 批量提取多个节点的内容
   * @param nodes 节点数组
   * @returns 提取的内容数组
   */
  public static extractMultipleContents(nodes: INode[]): ExtractedContent[] {
    console.log(`开始批量提取 ${nodes.length} 个节点的内容`);
    
    // 检查输入是否有效
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      console.error('无效的节点数组: ', nodes);
      return [];
    }
    
    // 过滤掉无效节点
    const validNodes = nodes.filter(node => node && node.id);
    
    if (validNodes.length !== nodes.length) {
      console.warn(`过滤掉了 ${nodes.length - validNodes.length} 个无效节点`);
    }
    
    if (validNodes.length === 0) {
      console.error('没有有效的节点可以提取');
      return [];
    }
    
    // 提取每个节点的内容
    const contents: ExtractedContent[] = [];
    
    for (const node of validNodes) {
      try {
        const extractedContent = this.extractContent(node);
        contents.push(extractedContent);
      } catch (error) {
        console.error(`提取节点 ${node.id} 内容时发生错误:`, error);
        // 添加一个错误内容，保持索引一致性
        contents.push({
          text: `提取内容时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          type: node.type || '未知类型',
          title: '提取错误',
          originalNode: node
        });
      }
    }
    
    // 验证提取的内容
    const emptyContents = contents.filter(content => !content.text || content.text.trim() === '');
    if (emptyContents.length > 0) {
      console.warn(`警告: ${emptyContents.length} 个节点提取后内容为空`);
    }
    
    // 记录提取结果统计
    console.log(`成功提取了 ${contents.length} 个节点的内容，内容汇总:`);
    const contentStats = {
      总节点数: contents.length,
      有效内容数: contents.filter(c => c.text && c.text.trim() !== '').length,
      类型分布: contents.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      平均内容长度: contents.reduce((sum, c) => sum + (c.text?.length || 0), 0) / contents.length
    };
    console.log('内容统计:', contentStats);
    
    // 记录每个提取的内容的基本信息
    contents.forEach((content, index) => {
      console.log(`节点 ${index+1}: 类型=${content.type}, 标题=${content.title || '无标题'}, 内容长度=${content.text.length}`);
      // 输出内容预览
      if (content.text.length > 0) {
        console.log(`内容预览: ${content.text.substring(0, 100)}${content.text.length > 100 ? '...' : ''}`);
      }
    });
    
    return contents;
  }
} 