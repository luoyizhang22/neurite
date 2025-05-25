/**
 * PromptBuilder.ts
 * 智能提示词构建器，用于根据不同的分析类型构建提示词
 * Smart prompt builder for constructing prompts based on different analysis types
 */

import { ExtractedContent } from './ContentExtractor';

export type AnalysisType = 
  | 'compare'      // 比较分析 / Comparative analysis
  | 'synthesize'   // 综合分析 / Synthesis analysis
  | 'relations'    // 关系探索 / Relationship exploration
  | 'debate'       // 辩论式思考 / Debate-style thinking
  | 'custom';      // 自定义分析 / Custom analysis

/**
 * 提示词选项接口
 * Prompt options interface
 */
export interface PromptOptions {
  temperature: number;      // 温度参数，影响生成的随机性 / Temperature parameter affecting randomness
  maxTokens: number;        // 最大生成token数 / Maximum number of tokens to generate
  includeImages: boolean;   // 是否包含图片信息 / Whether to include image information
  detailLevel: 'basic' | 'detailed' | 'comprehensive'; // 分析详细程度 / Level of analysis detail
  outputFormat: 'markdown' | 'json' | 'text';  // 输出格式 / Output format
  language: 'zh' | 'en';    // 语言 / Language
  customInstructions?: string;  // 自定义指令 / Custom instructions
  useCustomTemplates?: boolean; // 使用自定义模板 / Use custom templates
  customPromptTemplate?: string; // 自定义提示词模板 / Custom prompt template
}

/**
 * 提示词构建器类
 * 负责根据不同的分析类型和节点内容构建AI提示词
 * 
 * Prompt Builder Class
 * Responsible for constructing AI prompts based on different analysis types and node content
 */
export class PromptBuilder {
  private static readonly DEFAULT_OPTIONS: PromptOptions = {
    temperature: 0.7,
    maxTokens: 1000,
    includeImages: true,
    detailLevel: 'detailed',
    outputFormat: 'markdown',
    language: 'zh'
  };

  /**
   * 构建系统提示词
   * @param analysisType 分析类型
   * @param options 提示词选项
   * @returns 系统提示词
   * 
   * Build system prompt
   * @param analysisType Analysis type
   * @param options Prompt options
   * @returns System prompt
   */
  public static buildSystemPrompt(analysisType: AnalysisType, options: Partial<PromptOptions> = {}): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const { outputFormat, language, detailLevel } = mergedOptions;
    
    // 尝试获取用户自定义提示词模板
    // Try to get user custom prompt template
    if (options.useCustomTemplates && options.customPromptTemplate) {
      return options.customPromptTemplate;
    }
    
    // 基础系统提示词 (根据语言选择)
    // Base system prompt (selected by language)
    let systemPrompt = '';
    
    if (language === 'zh') {
      systemPrompt = '你是Neurite-Storm的AI助手，擅长分析不同类型的内容，包括文本、图片、链接和AI对话。你的回答将直接显示给用户，所以请确保格式美观、内容有用。';
    } else {
      systemPrompt = 'You are the AI assistant for Neurite-Storm, skilled at analyzing different types of content, including text, images, links, and AI conversations. Your responses will be displayed directly to users, so ensure they are well-formatted and useful.';
    }
    
    // 根据分析类型添加特定指令 (根据语言选择)
    // Add specific instructions based on analysis type (selected by language)
    switch (analysisType) {
      case 'compare':
        if (language === 'zh') {
          systemPrompt += '你特别擅长比较不同概念之间的异同点，找出它们的共性和差异。请确保你的比较全面、深入、有条理。';
        } else {
          systemPrompt += 'You are particularly good at comparing similarities and differences between different concepts, identifying commonalities and distinctions. Please ensure your comparison is comprehensive, in-depth, and well-organized.';
        }
        break;
      case 'synthesize':
        if (language === 'zh') {
          systemPrompt += '你特别擅长综合多种信息，形成更高层次的理解和洞察。请尝试发现隐藏的联系并提供新的视角。';
        } else {
          systemPrompt += 'You excel at synthesizing diverse information to form higher-level understanding and insights. Please try to discover hidden connections and provide new perspectives.';
        }
        break;
      case 'relations':
        if (language === 'zh') {
          systemPrompt += '你特别擅长发现不同概念之间的关系和连接，包括因果关系、层次关系和相关性。请尽量构建出完整的关系网络。';
        } else {
          systemPrompt += 'You are particularly skilled at discovering relationships and connections between different concepts, including causal relationships, hierarchical relationships, and correlations. Please try to construct a complete relationship network.';
        }
        break;
      case 'debate':
        if (language === 'zh') {
          systemPrompt += '你特别擅长辩证思考，能够从多个角度分析问题，提供平衡的观点。请确保你考虑到各种可能的立场和论点。';
        } else {
          systemPrompt += 'You excel at dialectical thinking, capable of analyzing issues from multiple perspectives and providing balanced viewpoints. Please ensure you consider various possible positions and arguments.';
        }
        break;
      case 'custom':
        if (language === 'zh') {
          systemPrompt += '你能够根据用户的具体指令灵活分析内容，提供定制化的见解。请严格按照用户的要求进行回答。';
        } else {
          systemPrompt += 'You can flexibly analyze content according to specific user instructions, providing customized insights. Please respond strictly according to the user\'s requirements.';
        }
        break;
    }
    
    // 添加内容适应指令 (根据语言选择)
    // Add content adaptation instructions (selected by language)
    if (language === 'zh') {
      systemPrompt += '\n你的分析应适应内容的复杂度和性质，对于简单的卡片内容提供简洁明了的分析，对于复杂的概念提供更深入的探讨。';
    } else {
      systemPrompt += '\nYour analysis should adapt to the complexity and nature of the content, providing concise analysis for simple card content and more in-depth discussion for complex concepts.';
    }
    
    // 添加输出格式指令 (根据语言选择)
    // Add output format instructions (selected by language)
    if (outputFormat === 'markdown') {
      if (language === 'zh') {
        systemPrompt += '\n请使用Markdown格式回复，包含标题、小标题、列表和强调等格式，使内容更易于阅读和理解。';
      } else {
        systemPrompt += '\nPlease reply using Markdown format, including headers, subheaders, lists, and emphasis, to make the content easier to read and understand.';
      }
    } else if (outputFormat === 'json') {
      if (language === 'zh') {
        systemPrompt += '\n请以JSON格式回复，确保结构清晰且符合JSON语法。结构应包含主要发现、分析和结论等部分。';
      } else {
        systemPrompt += '\nPlease reply in JSON format, ensuring the structure is clear and complies with JSON syntax. The structure should include sections for main findings, analysis, and conclusions.';
      }
    } else {
      if (language === 'zh') {
        systemPrompt += '\n请使用纯文本格式回复，通过空行和段落标记确保内容清晰可读。';
      } else {
        systemPrompt += '\nPlease use plain text format for your reply, ensuring content clarity and readability through blank lines and paragraph marks.';
      }
    }
    
    // Add detail level instructions (selected by language)
    switch (detailLevel) {
      case 'basic':
        if (language === 'zh') {
          systemPrompt += '\n请提供简明扼要的分析，只突出最关键的要点，适合快速阅读和理解。';
        } else {
          systemPrompt += '\nPlease provide concise analysis, highlighting only the most critical points, suitable for quick reading and understanding.';
        }
        break;
      case 'detailed':
        if (language === 'zh') {
          systemPrompt += '\n请提供详细分析，包括充分的解释和示例，帮助用户深入理解内容的各个方面。';
        } else {
          systemPrompt += '\nPlease provide detailed analysis, including thorough explanations and examples, to help users deeply understand various aspects of the content.';
        }
        break;
      case 'comprehensive':
        if (language === 'zh') {
          systemPrompt += '\n请提供全面深入的分析，包括多层次思考、相关背景、潜在影响和实际应用，为用户提供最完整的视角。';
        } else {
          systemPrompt += '\nPlease provide comprehensive and in-depth analysis, including multi-level thinking, relevant background, potential impacts, and practical applications, offering users the most complete perspective.';
        }
        break;
    }
    
    // Add language instructions
    systemPrompt += `\nPlease respond in ${language === 'zh' ? 'Chinese' : 'English'}.`;
    
    return systemPrompt;
  }

  /**
   * 根据分析类型构建提示词
   * @param analysisType 分析类型
   * @param contents 内容数组
   * @param customPrompt 自定义提示词（仅在custom类型时使用）
   * @param options 提示词选项
   * @returns 提示词
   * 
   * Build prompt by analysis type
   * @param analysisType Analysis type
   * @param contents Content array
   * @param customPrompt Custom prompt (used only for custom type)
   * @param options Prompt options
   * @returns Prompt
   */
  public static buildPromptByType(
    analysisType: AnalysisType,
    contents: ExtractedContent[],
    customPrompt?: string,
    options: Partial<PromptOptions> = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const language = mergedOptions.language;
    
    // 如果是自定义分析，且提供了自定义提示词，直接返回
    // If it's a custom analysis and a custom prompt is provided, return it directly
    if (analysisType === 'custom' && customPrompt) {
      return customPrompt || (language === 'zh' ? "请提供要分析的内容。" : "Please provide the content to analyze.");
    }
    
    // 验证内容 / Validate content
    if (contents.length === 0) {
      return customPrompt || (language === 'zh' ? 
        "提供的所有内容都为空，无法进行分析。" : 
        "All provided content is empty, analysis cannot be performed.");
    }
    
    // 过滤空内容 / Filter empty content
    const validContents = contents.filter(content => 
      content.text && content.text.trim() !== ''
    );
    
    if (validContents.length === 0) {
      return customPrompt || (language === 'zh' ? 
        "提供的所有内容都为空，无法进行分析。" : 
        "All provided content is empty, analysis cannot be performed.");
    }
    
    console.log(language === 'zh' ?
      `开始构建${analysisType}类型的提示词，基于${validContents.length}个内容对象` :
      `Started building ${analysisType} type prompt, based on ${validContents.length} content objects`);
    
    // 验证内容对象 / Validate content objects
    const emptyContents = validContents.filter(c => !c.text || c.text.trim() === '');
    if (emptyContents.length > 0) {
      console.warn(language === 'zh' ?
        `警告: ${emptyContents.length}/${validContents.length} 个内容对象为空` :
        `Warning: ${emptyContents.length}/${validContents.length} content objects are empty`);
    }
    
    // 智能判断节点内容类型和复杂度 / Intelligently determine node content type and complexity
    const contentComplexity = this.analyzeContentComplexity(validContents);
    const contentTypes = this.analyzeContentTypes(validContents);
    
    console.log(language === 'zh' ?
      `内容分析结果: 复杂度=${contentComplexity}, 类型=${Array.from(contentTypes).join(',')}` :
      `Content analysis result: complexity=${contentComplexity}, types=${Array.from(contentTypes).join(',')}`);
    
    // 内容长度控制常量 / Content length control constants
    const MAX_CONTENT_LENGTH = 6000; // 每个内容的最大长度 / Maximum length for each content
    const MAX_TOTAL_CONTENT_LENGTH = 12000; // 所有内容的最大总长度 / Maximum total length for all content
    
    // 计算内容长度预算 / Calculate content length budget
    const totalRawLength = validContents.reduce((sum, c) => sum + (c.text?.length || 0), 0);
    console.log(language === 'zh' ?
      `原始内容总长度: ${totalRawLength}字符` :
      `Original total content length: ${totalRawLength} characters`);
    
    // 如果总长度超过限制，按比例缩减每个内容 / If total length exceeds limit, reduce each content proportionally
    let contentLengthBudget = MAX_CONTENT_LENGTH;
    if (totalRawLength > MAX_TOTAL_CONTENT_LENGTH) {
      const ratio = MAX_TOTAL_CONTENT_LENGTH / totalRawLength;
      contentLengthBudget = Math.floor(MAX_CONTENT_LENGTH * ratio);
      console.log(language === 'zh' ?
        `内容过长，缩减为原来的${Math.round(ratio * 100)}%，每个内容最多${contentLengthBudget}字符` :
        `Content too long, reducing to ${Math.round(ratio * 100)}% of original, maximum ${contentLengthBudget} characters per content`);
    }
    
    // 格式化内容，确保每个内容都在长度预算内
    let formattedContents = validContents.map((content, index) => {
      // 裁剪过长的内容
      let contentText = content.text || '';
      if (contentText.length > contentLengthBudget) {
        // 保留前60%和后40%的内容，中间部分用...替代
        const frontPart = Math.floor(contentLengthBudget * 0.6);
        const backPart = contentLengthBudget - frontPart - 5; // 5是"..."的长度加一些余量
        contentText = contentText.substring(0, frontPart) + " ... " + 
                      contentText.substring(contentText.length - backPart);
        
        console.log(language === 'zh' ?
          `内容 ${index + 1} 已裁剪从 ${content.text?.length} 到 ${contentText.length} 字符` :
          `Content ${index + 1} trimmed from ${content.text?.length} to ${contentText.length} characters`);
      }
      
      // 根据内容类型格式化
      let contentTitle = content.title || (language === 'zh' ? `内容 ${index + 1}` : `Content ${index + 1}`);
      
      // 添加类型标记
      let typeLabel = '';
      if (content.type) {
        typeLabel = language === 'zh' ? `【类型: ${content.type}】` : `[Type: ${content.type}]`;
      }
      
      return `### ${contentTitle} ${typeLabel}\n${contentText}\n`;
    }).join('\n');
    
    // 检查格式化后的内容
    if (!formattedContents || formattedContents.trim() === '') {
      console.error(language === 'zh' ? 
        '格式化内容为空，使用紧急恢复机制' : 
        'Formatted content is empty, using emergency recovery mechanism');
      
      const emergencyContent = validContents.map((content, index) => 
        language === 'zh' ?
        `内容${index + 1}: ${content.text.substring(0, 500)}` :
        `Content ${index + 1}: ${content.text.substring(0, 500)}`
      ).join('\n\n');
      
      if (emergencyContent.trim() === '') {
        return customPrompt || (language === 'zh' ? 
          "无法构建有效的提示词，请确保提供的内容不为空。" : 
          "Unable to build a valid prompt, please ensure the provided content is not empty.");
      }
      
      formattedContents = emergencyContent;
    }
    
    // 记录提取的内容，用于调试
    console.log(language === 'zh' ?
      `已格式化 ${validContents.length} 个节点的内容，总长度: ${formattedContents.length}` :
      `Formatted content for ${validContents.length} nodes, total length: ${formattedContents.length}`);
      
    console.log(language === 'zh' ?
      '格式化内容预览:' : 
      'Formatted content preview:', 
      formattedContents.substring(0, 200) + '...');
    
    // 根据分析类型和内容特点构建提示词
    let prompt = '';
    switch (analysisType) {
      case 'compare':
        prompt = this.buildComparePrompt(validContents, formattedContents, contentComplexity, contentTypes, mergedOptions.language);
        break;
        
      case 'synthesize':
        prompt = this.buildSynthesizePrompt(validContents, formattedContents, contentComplexity, contentTypes, mergedOptions.language);
        break;
        
      case 'relations':
        prompt = this.buildRelationsPrompt(validContents, formattedContents, contentComplexity, contentTypes, mergedOptions.language);
        break;
        
      case 'debate':
        prompt = this.buildDebatePrompt(validContents, formattedContents, contentComplexity, contentTypes, mergedOptions.language);
        break;
        
      case 'custom':
        prompt = customPrompt || '请分析以下内容:';
        prompt += `\n\n${formattedContents}`;
        break;
    }
    
    // 添加自定义指令（如果有）
    if (mergedOptions.customInstructions) {
      prompt += `\n\n${mergedOptions.customInstructions}`;
    }
    
    // 验证最终提示词是否包含内容样本
    this.verifyPromptContent(prompt, validContents);
    
    // 检查最终提示词长度
    console.log(language === 'zh' ? 
      '最终提示词长度:' : 
      'Final prompt length:', prompt.length, 
      language === 'zh' ? '字符' : 'characters');
    
    // 如果提示词超过16000个字符，发出警告
    if (prompt.length > 16000) {
      console.warn(language === 'zh' ?
        `警告: 提示词长度(${prompt.length}字符)可能超出模型上下文窗口` :
        `Warning: Prompt length (${prompt.length} characters) may exceed model context window`);
    }
    
    return prompt;
  }
  
  /**
   * 验证提示词是否包含内容样本
   * @param prompt 提示词
   * @param contents 内容对象数组
   * 
   * Verify if the prompt contains content samples
   * @param prompt Prompt text
   * @param contents Content object array
   */
  private static verifyPromptContent(prompt: string, contents: ExtractedContent[]): void {
    if (contents.length === 0 || !prompt) return;
    
    // 抽取每个内容的特征样本进行检查 / Extract characteristic samples from each content for verification
    let missingContents = 0;
    
    for (const content of contents) {
      if (!content.text || content.text.length < 20) continue;
      
      // 从内容中提取特征性文本（前20个字符）/ Extract characteristic text from content (first 20 characters)
      const sampleText = content.text.substring(0, 20).trim();
      
      // 检查提示词是否包含该样本 / Check if the prompt contains the sample
      if (!prompt.includes(sampleText)) {
        console.warn(`Warning: Prompt does not contain content sample "${sampleText}..."`);
        missingContents++;
      }
    }
    
    if (missingContents > 0) {
      const percentage = Math.round((missingContents / contents.length) * 100);
      console.warn(`Warning: ${missingContents}/${contents.length} content items (${percentage}%) may not be included in the prompt.`);
    }
  }

  /**
   * 构建比较分析提示词
   * Build comparative analysis prompt
   */
  private static buildComparePrompt(
    contents: ExtractedContent[], 
    formattedContents: string,
    complexity: 'simple' | 'moderate' | 'complex',
    types: Set<string>,
    language: 'zh' | 'en' = 'zh'
  ): string {
    let prompt = '';
    
    if (language === 'zh') {
      prompt = `比较以下${contents.length}个${contents.length > 2 ? '概念' : '概念'}之间的异同点:\n\n${formattedContents}\n\n`;
      
      // 根据内容复杂度调整比较深度
      if (complexity === 'simple') {
        prompt += "请提供清晰简洁的比较，重点关注最明显的异同点，使用表格或列表使结果易于理解。";
      } else if (complexity === 'moderate') {
        prompt += "请提供详细的比较分析，包括定义、特征、功能/用途和关键差异。可以使用表格来呈现比较结果，并补充说明重要的细节。";
      } else {
        prompt += "请提供全面深入的比较分析，包括历史背景、理论基础、核心概念、应用场景、优缺点和发展趋势等多维度的对比。分析应揭示深层次的联系与差异。";
      }
      
      // 根据内容类型添加特定指导
      if (types.has('图片')) {
        prompt += "\n对于图片内容，请关注视觉元素、构图、色彩、风格等方面的比较。";
      }
      if (types.has('链接')) {
        prompt += "\n对于链接内容，请关注来源可靠性、信息时效性和内容焦点的比较。";
      }
      if (types.has('辩论')) {
        prompt += "\n对于辩论内容，请比较不同立场的论证结构、论据强度和逻辑严密性。";
      }
    } else {
      prompt = `Compare the similarities and differences between the following ${contents.length} concept${contents.length > 1 ? 's' : ''}:\n\n${formattedContents}\n\n`;
      
      // Adjust comparison depth based on content complexity
      if (complexity === 'simple') {
        prompt += "Please provide a clear and concise comparison, focusing on the most obvious similarities and differences. Use tables or lists to make the results easy to understand.";
      } else if (complexity === 'moderate') {
        prompt += "Please provide a detailed comparative analysis, including definitions, characteristics, functions/uses, and key differences. You can use tables to present comparison results and supplement with explanations of important details.";
      } else {
        prompt += "Please provide a comprehensive and in-depth comparative analysis, including multi-dimensional comparisons of historical background, theoretical foundations, core concepts, application scenarios, advantages and disadvantages, and development trends. The analysis should reveal deep connections and differences.";
      }
      
      // Add specific guidance based on content type
      if (types.has('图片') || types.has('image')) {
        prompt += "\nFor image content, please focus on comparing visual elements, composition, color, style, and other aspects.";
      }
      if (types.has('链接') || types.has('link')) {
        prompt += "\nFor link content, please focus on comparing source reliability, information timeliness, and content focus.";
      }
      if (types.has('辩论') || types.has('debate')) {
        prompt += "\nFor debate content, please compare the argumentative structure, argument strength, and logical rigor of different positions.";
      }
    }
    
    return prompt;
  }

  /**
   * 构建综合分析提示词
   * Build synthesis analysis prompt
   */
  private static buildSynthesizePrompt(
    contents: ExtractedContent[], 
    formattedContents: string,
    complexity: 'simple' | 'moderate' | 'complex',
    types: Set<string>,
    language: 'zh' | 'en' = 'zh'
  ): string {
    let prompt = '';
    
    if (language === 'zh') {
      prompt = `综合分析以下${contents.length > 1 ? `${contents.length}条` : ''}信息，并创建一个整合的概念:\n\n${formattedContents}\n\n`;
      
      // 根据内容复杂度调整综合深度
      if (complexity === 'simple') {
        prompt += "请提供简明扼要的综合分析，整合核心要点，形成一个清晰的概念框架。";
      } else if (complexity === 'moderate') {
        prompt += "请提供详细的综合分析，识别各部分之间的联系，并解释它们如何共同构成一个更大的概念。重点关注潜在的模式和主题。";
      } else {
        prompt += "请提供深入全面的综合分析，探索信息间的复杂互动，构建一个多层次的概念体系。分析应包含理论框架、实际应用和创新见解。";
      }
      
      // 若内容较多，添加结构化输出建议
      if (contents.length > 3) {
        prompt += "\n由于信息较多，请考虑使用章节、小标题和列表等结构元素来组织你的分析，确保清晰可读。";
      }
      
      // 根据内容类型添加特定指导
      if (types.size > 2) {
        prompt += "\n请特别注意不同类型内容之间的互补性，解释它们如何共同提供更完整的视角。";
      }
    } else {
      prompt = `Synthesize the following ${contents.length > 1 ? `${contents.length} pieces of ` : ''}information and create an integrated concept:\n\n${formattedContents}\n\n`;
      
      // Adjust synthesis depth based on content complexity
      if (complexity === 'simple') {
        prompt += "Please provide a concise synthesis that integrates core points to form a clear conceptual framework.";
      } else if (complexity === 'moderate') {
        prompt += "Please provide a detailed synthesis that identifies the connections between different parts and explains how they together form a larger concept. Focus on potential patterns and themes.";
      } else {
        prompt += "Please provide an in-depth and comprehensive synthesis that explores the complex interactions between information pieces to build a multi-layered conceptual system. The analysis should include theoretical frameworks, practical applications, and innovative insights.";
      }
      
      // Add structured output suggestions if content is substantial
      if (contents.length > 3) {
        prompt += "\nDue to the large amount of information, please consider using structural elements such as sections, subheadings, and lists to organize your analysis, ensuring clarity and readability.";
      }
      
      // Add specific guidance based on content types
      if (types.size > 2) {
        prompt += "\nPlease pay special attention to the complementarity between different types of content, explaining how they together provide a more complete perspective.";
      }
    }
    
    return prompt;
  }

  /**
   * 构建关系分析提示词
   * Build relationship analysis prompt
   */
  private static buildRelationsPrompt(
    contents: ExtractedContent[], 
    formattedContents: string,
    complexity: 'simple' | 'moderate' | 'complex',
    types: Set<string>,
    language: 'zh' | 'en' = 'zh'
  ): string {
    let prompt = '';
    
    if (language === 'zh') {
      prompt = `探索以下概念之间可能存在的关系和连接:\n\n${formattedContents}\n\n`;
      
      // 根据内容复杂度调整关系分析深度
      if (complexity === 'simple') {
        prompt += "请识别并描述最明显的直接关系，使用简单的图表或列表呈现关系结构。";
      } else if (complexity === 'moderate') {
        prompt += "请分析概念间的多种关系类型（如因果、层次、互补等），并解释这些关系如何影响整体理解。";
      } else {
        prompt += "请深入探索概念间的复杂关系网络，包括直接和间接关系、显性和隐性联系，以及潜在的系统性影响。考虑历史演变、理论关联和实践应用中的关系动态。";
      }
      
      // 添加关系类型提示
      prompt += "\n请考虑以下可能的关系类型：\n- 因果关系（一个概念如何导致或影响另一个）\n- 层次关系（概念间的从属或包含关系）\n- 互补关系（概念如何相互补充或增强）\n- 对立关系（概念间的矛盾或冲突）\n- 演化关系（概念间的发展或转变过程）";
    } else {
      prompt = `Explore the potential relationships and connections between the following concepts:\n\n${formattedContents}\n\n`;
      
      // Adjust relationship analysis depth based on content complexity
      if (complexity === 'simple') {
        prompt += "Please identify and describe the most obvious direct relationships, using simple diagrams or lists to present the relationship structure.";
      } else if (complexity === 'moderate') {
        prompt += "Please analyze multiple types of relationships between concepts (such as causal, hierarchical, complementary, etc.), and explain how these relationships affect overall understanding.";
      } else {
        prompt += "Please deeply explore the complex network of relationships between concepts, including direct and indirect relationships, explicit and implicit connections, and potential systemic impacts. Consider relationship dynamics in historical evolution, theoretical associations, and practical applications.";
      }
      
      // Add relationship type prompts
      prompt += "\nPlease consider the following possible relationship types:\n- Causal relationships (how one concept causes or influences another)\n- Hierarchical relationships (subordinate or inclusive relationships between concepts)\n- Complementary relationships (how concepts complement or enhance each other)\n- Opposing relationships (contradictions or conflicts between concepts)\n- Evolutionary relationships (development or transformation processes between concepts)";
    }
    
    return prompt;
  }

  /**
   * 构建辩论分析提示词
   * Build debate analysis prompt
   */
  private static buildDebatePrompt(
    contents: ExtractedContent[], 
    formattedContents: string,
    complexity: 'simple' | 'moderate' | 'complex',
    types: Set<string>,
    language: 'zh' | 'en' = 'zh'
  ): string {
    let prompt = '';
    
    if (language === 'zh') {
      prompt = `针对以下内容进行辩论式分析，提供多角度思考:\n\n${formattedContents}\n\n`;
      
      // 根据内容复杂度调整辩论分析深度
      if (complexity === 'simple') {
        prompt += "请提供明确的正反两方观点，列出主要论点和简短理由。";
      } else if (complexity === 'moderate') {
        prompt += "请从支持、反对和折中三个角度进行分析，考虑各种观点的优缺点和适用条件。";
      } else {
        prompt += "请提供全面的辩证分析，探索多个立场（至少4-5个不同视角），并深入考察每个立场的哲学基础、实证支持、实际应用和伦理影响。";
      }
      
      prompt += "\n请确保你的分析:\n1. 公正地呈现各方观点\n2. 评估每个论点的说服力和局限性\n3. 考虑潜在的反驳和回应\n4. 在可能的情况下，提出可能的调和或整合方案";
    } else {
      prompt = `Conduct a debate-style analysis of the following content, providing multi-perspective thinking:\n\n${formattedContents}\n\n`;
      
      // Adjust debate analysis depth based on content complexity
      if (complexity === 'simple') {
        prompt += "Please provide clear pro and con perspectives, listing main points and brief rationales.";
      } else if (complexity === 'moderate') {
        prompt += "Please analyze from three perspectives: supportive, opposing, and moderate, considering the advantages, disadvantages, and applicable conditions of various viewpoints.";
      } else {
        prompt += "Please provide a comprehensive dialectical analysis, exploring multiple positions (at least 4-5 different perspectives), and deeply examining the philosophical foundations, empirical support, practical applications, and ethical implications of each position.";
      }
      
      prompt += "\nPlease ensure your analysis:\n1. Fairly presents all perspectives\n2. Evaluates the persuasiveness and limitations of each argument\n3. Considers potential rebuttals and responses\n4. Where possible, proposes potential reconciliation or integration schemes";
    }
    
    return prompt;
  }

  /**
   * 分析内容复杂度
   * @returns 内容复杂度评估
   * 
   * Analyze content complexity
   * @returns Content complexity assessment
   */
  private static analyzeContentComplexity(contents: ExtractedContent[]): 'simple' | 'moderate' | 'complex' {
    // 计算平均内容长度 / Calculate average content length
    const avgLength = contents.reduce((sum, content) => sum + content.text.length, 0) / contents.length;
    
    // 检查是否包含复杂概念的关键词（中英双语）
    // Check for keywords indicating complex concepts (bilingual)
    const complexityIndicators = [
      // Chinese indicators
      "理论", "框架", "系统", "哲学", "方法论", "机制", "复杂", "多维", 
      "辩证", "分析", "综合", "批判", "评估", "比较", "量化", "质化",
      "研究", "科学", "技术", "算法", "模型", "架构", "标准", "协议",
      
      // English indicators
      "theory", "framework", "system", "philosophy", "methodology", "mechanism", "complex", "multidimensional",
      "dialectic", "analysis", "synthesis", "critique", "evaluation", "comparison", "quantitative", "qualitative",
      "research", "scientific", "technology", "algorithm", "model", "architecture", "standard", "protocol"
    ];
    
    let complexityScore = 0;
    
    // 基于长度评分 / Score based on length
    if (avgLength < 100) complexityScore += 1;
    else if (avgLength < 500) complexityScore += 2;
    else complexityScore += 3;
    
    // 基于复杂度指标词汇评分 / Score based on complexity indicator vocabulary
    const allText = contents.map(c => c.text).join(" ").toLowerCase();
    const indicatorCount = complexityIndicators.filter(word => 
      allText.includes(word.toLowerCase())
    ).length;
    
    if (indicatorCount < 3) complexityScore += 1;
    else if (indicatorCount < 8) complexityScore += 2;
    else complexityScore += 3;
    
    // 基于内容类型评分 / Score based on content type
    const hasComplexTypes = contents.some(c => 
      c.type === '辩论' || c.type === 'debate' || c.type === 'AI' || 
      (c.metadata && c.metadata.format === 'markdown' && c.text.length > 300)
    );
    
    if (hasComplexTypes) complexityScore += 2;
    else complexityScore += 1;
    
    // 根据总分确定复杂度 / Determine complexity based on total score
    const avgScore = complexityScore / 3;
    if (avgScore < 1.5) return 'simple';
    if (avgScore < 2.5) return 'moderate';
    return 'complex';
  }

  /**
   * 分析内容类型
   * @returns 内容类型集合
   * 
   * Analyze content types
   * @returns Set of content types
   */
  private static analyzeContentTypes(contents: ExtractedContent[]): Set<string> {
    return new Set(contents.map(content => content.type));
  }

  /**
   * 构建摘要提示词
   * @param content 要摘要的内容
   * @param options 提示词选项
   * @returns 摘要提示词
   * 
   * Build summary prompt
   * @param content Content to summarize
   * @param options Prompt options
   * @returns Summary prompt
   */
  public static buildSummaryPrompt(content: string, options: Partial<PromptOptions> = {}): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const { detailLevel, language } = mergedOptions;
    
    let prompt = '';
    
    if (language === 'zh') {
      prompt = '请总结以下内容的要点:';
      
      // 根据详细程度调整摘要指令
      switch (detailLevel) {
        case 'basic':
          prompt += '\n请提供一个简短的摘要（3-5句话），只包含最核心的信息。';
          break;
        case 'detailed':
          prompt += '\n请提供一个结构化的摘要，包含主要观点、支持证据和结论。使用要点列表形式。';
          break;
        case 'comprehensive':
          prompt += '\n请提供全面详尽的摘要，包含主题背景、关键观点、论证结构、结论以及潜在影响。保持原文的核心意图和复杂性。';
          break;
      }
    } else {
      prompt = 'Please summarize the key points of the following content:';
      
      // Adjust summary instructions based on detail level
      switch (detailLevel) {
        case 'basic':
          prompt += '\nPlease provide a brief summary (3-5 sentences) containing only the most essential information.';
          break;
        case 'detailed':
          prompt += '\nPlease provide a structured summary including main ideas, supporting evidence, and conclusions. Use a bullet point format.';
          break;
        case 'comprehensive':
          prompt += '\nPlease provide a comprehensive and detailed summary including background context, key points, argument structure, conclusions, and potential implications. Maintain the core intentions and complexity of the original text.';
          break;
      }
    }
    
    prompt += `\n\n${content}`;
    return prompt;
  }

  /**
   * 构建关键词提取提示词
   * @param content 要提取关键词的内容
   * @param keywordCount 要提取的关键词数量
   * @param options 提示词选项
   * @returns 关键词提取提示词
   * 
   * Build keyword extraction prompt
   * @param content Content to extract keywords from
   * @param keywordCount Number of keywords to extract
   * @param options Prompt options
   * @returns Keyword extraction prompt
   */
  public static buildKeywordExtractionPrompt(
    content: string, 
    keywordCount: number = 5, 
    options: Partial<PromptOptions> = {}
  ): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const language = mergedOptions.language;
    
    if (language === 'zh') {
      return `请从以下内容中提取${keywordCount}个最重要的关键词或短语，并按重要性排序:\n\n${content}`;
    } else {
      return `Please extract the ${keywordCount} most important keywords or phrases from the following content, and rank them by importance:\n\n${content}`;
    }
  }
}