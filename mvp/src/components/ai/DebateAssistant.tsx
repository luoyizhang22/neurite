import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Drawer, DrawerBody, DrawerCloseButton,
  DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  Flex, FormControl, FormLabel, Heading, HStack, IconButton,
  Input, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, NumberDecrementStepper,
  NumberIncrementStepper, NumberInput, NumberInputField,
  NumberInputStepper, Radio, RadioGroup, SimpleGrid, Spacer,
  Spinner, Stack, Text, Textarea, useColorModeValue, useDisclosure,
  useToast, VStack, Tab, TabList, Tabs, Badge, Center, Divider,
  ButtonGroup, Accordion, AccordionItem, AccordionButton, AccordionIcon,
  AccordionPanel, Card, CardHeader, CardBody, CardFooter, Select,
  FormHelperText, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
  Tooltip, Circle, Collapse
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon, BellIcon } from '@chakra-ui/icons';
import { Icon } from '@chakra-ui/react';
import { FiCpu, FiGitBranch, FiArrowLeft, FiSave, FiThumbsUp, FiThumbsDown, FiInfo, FiZap, FiSettings, FiX } from 'react-icons/fi';
import { PromptBuilder, PromptOptions } from '../../api/PromptBuilder';
import { INode as GraphINode } from '../../types/graph'; // 导入正确的INode类型
import { marked } from 'marked';
import aiService, { AIProvider } from '../../api/aiService';
import { ContentExtractor, ExtractedContent } from '../../api/ContentExtractor';

// 本地使用的INode接口，兼容GraphINode
interface INode {
  id: string;
  type: "text" | "link" | "image" | "ai" | "question" | "answer" | "debate" | "port" | "aiagent" | string;
  position: { x: number; y: number };
  data: any;
  connectedTo?: string[];
  metadata?: any;
  content?: string; // 添加可选的content字段，兼容旧代码
}

// 辩论助手组件接口
interface DebateAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodes: GraphINode[]; // 使用导入的GraphINode类型
  onAddNode?: (nodeData: any) => void;
  onSaveAnalysis?: (analysisData: any) => Promise<void>;
}

// 添加一个模型类型接口
interface ModelOption {
  id: string;
  name: string;
  type: 'local' | 'remote';
  provider: string;
  description?: string;
}

// 添加DebateStyle类型定义
type DebateStyle = 'academic' | 'socratic' | 'creative';

/**
 * 辩论助手组件
 * 
 * 这个组件实现了一种辩证思维的AI辅助功能，允许用户：
 * 1. 基于选中的节点内容生成多个不同角度的观点
 * 2. 对这些观点进行思辨分析和对比
 * 3. 生成综合性的思考，帮助用户形成更全面的理解
 */
const DialogicalThinkingAssistant: React.FC<DebateAssistantProps> = ({
  isOpen,
  onClose,
  selectedNodes,
  onAddNode,
  onSaveAnalysis
}): JSX.Element => {
  // 颜色设置
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = 'purple.500';
  const highlightBg = useColorModeValue('purple.50', 'purple.900');
  
  // Toast通知
  const toast = useToast();
  
  // 重命名状态变量，使其更加直观
  const [topic, setTopic] = useState('');
  const [perspectivesList, setPerspectivesList] = useState<string[]>([]);
  const [customPerspectives, setCustomPerspectives] = useState<string[]>([]);
  const [newPerspective, setNewPerspective] = useState('');
  const [isGeneratingPerspectives, setIsGeneratingPerspectives] = useState(false);
  const [selectedPerspectives, setSelectedPerspectives] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState('');
  const [persuasiveView, setPersuasiveView] = useState('');
  const [isGeneratingDebate, setIsGeneratingDebate] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [debateStyle, setDebateStyle] = useState('balanced');
  const [complexityLevel, setComplexityLevel] = useState(3);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userFeedback, setUserFeedback] = useState<'positive' | 'negative' | null>(null);
  const [extractedContents, setExtractedContents] = useState<ExtractedContent[]>([]);
  
  // 添加用户输入状态
  const [userInput, setUserInput] = useState('');
  const [dialogueHistory, setDialogueHistory] = useState<{question: string, answer: string}[]>([]);
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  
  // 多智能体辩论状态
  interface AgentResponse {
    agentId: string;
    perspective: string;
    response: string;
    references: { 
      targetAgentId: string; 
      type: 'agree' | 'disagree' | 'question' | 'extension'; 
      text: string;
    }[];
  }

  interface DebateRound {
    roundNumber: number;
    responses: AgentResponse[];
    summary: string;
  }

  // 多智能体辩论状态
  const [agentResponses, setAgentResponses] = useState<{ [perspectiveId: string]: AgentResponse[] }>({});
  const [debateRounds, setDebateRounds] = useState<DebateRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [connectionLines, setConnectionLines] = useState<{
    sourceId: string;
    targetId: string;
    type: 'agree' | 'disagree' | 'question' | 'extension';
    sourcePoint?: { x: number, y: number };
    targetPoint?: { x: number, y: number };
  }[]>([]);
  const [debateStatus, setDebateStatus] = useState<'idle' | 'generating' | 'paused' | 'completed'>('idle');
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [agentPositions, setAgentPositions] = useState<{[agentId: string]: {x: number, y: number}}>({});
  
  // 定义可用模型列表
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([
    // 本地模型
    { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', type: 'local', provider: 'ollama', description: '通义千问2.5 7B，适合中文辩论' },
    { id: 'llama3:8b', name: 'Llama 3 8B', type: 'local', provider: 'ollama', description: '开源大模型，参数量较小' },
    { id: 'llama3:70b', name: 'Llama 3 70B', type: 'local', provider: 'ollama', description: '开源大模型，性能较好' },
    { id: 'mistral:7b', name: 'Mistral 7B', type: 'local', provider: 'ollama', description: '高性能开源B模型' },
    { id: 'mixtral:8x7b', name: 'Mixtral 8x7B', type: 'local', provider: 'ollama', description: '混合专家模型，性能优异' },
    // 远程模型
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'remote', provider: 'openai', description: 'OpenAI的中等性能模型' },
    { id: 'gpt-4', name: 'GPT-4', type: 'remote', provider: 'openai', description: 'OpenAI的高性能模型' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', type: 'remote', provider: 'anthropic', description: 'Anthropic的高性能模型' }
  ]);

  // 添加检测到的本地模型列表
  const [detectedLocalModels, setDetectedLocalModels] = useState<ModelOption[]>([]);
  
  // 添加高级设置状态
  const [advancedSettings, setAdvancedSettings] = useState<{
    model: string;
    temperature: number;
    provider: AIProvider;
  }>({
    model: 'qwen2.5:7b',
    temperature: 0.7,
    provider: 'ollama'
  });
  
  // 高级设置
  const [promptOptions, setPromptOptions] = useState<Partial<PromptOptions>>({
    temperature: 0.7,
    detailLevel: 'detailed',
    outputFormat: 'markdown',
    language: 'zh'
  });
  
  // 添加缺失的状态变量
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  
  // 修改状态变量，添加分析类型选择
  const [analysisType, setAnalysisType] = useState<'single' | 'multi' | null>(null);
  const [isReadyForAnalysis, setIsReadyForAnalysis] = useState(false);
  const [isShowingOptions, setIsShowingOptions] = useState(false);
  
  // 当选中的节点改变时更新话题
  useEffect(() => {
    if (selectedNodes.length > 0) {
      // 使用ContentExtractor提取节点内容
      const contents = ContentExtractor.extractMultipleContents(selectedNodes);
      setExtractedContents(contents);
      
      // 从第一个节点提取内容作为讨论话题
      const firstNodeContent = contents[0];
      setTopic(firstNodeContent.title || firstNodeContent.text.substring(0, 50));
      
      // 重置状态
      setPerspectivesList([]);
      setCustomPerspectives([]);
      setSelectedPerspectives([]);
      setAnalysisResult('');
      setPersuasiveView('');
      setCurrentStep(1);
    }
  }, [selectedNodes]);
  
  // 修复提取节点内容的函数
  const getExtractedContent = () => {
    try {
      // 直接使用组件中的selectedNodes状态
      if (!selectedNodes || selectedNodes.length === 0) {
        return { content: '', imageUrl: '' };
      }
      
      // 使用第一个节点
      const node = selectedNodes[0];
      
      // 安全地提取内容
      const nodeData = node && node.data ? node.data : {};
      let content = '';
      let imageUrl = '';
      
      if (nodeData && typeof nodeData === 'object') {
        // 使用类型断言访问可能不存在的属性
        const typedNodeData = nodeData as any;
        if (typedNodeData.content && typeof typedNodeData.content === 'string') {
          content = typedNodeData.content;
        }
        if (typedNodeData.imageUrl && typeof typedNodeData.imageUrl === 'string') {
          imageUrl = typedNodeData.imageUrl;
        }
      }
      
      return { content, imageUrl };
    } catch (error) {
      console.error("提取节点内容时出错:", error);
      return { content: '', imageUrl: '' };
    }
  };

  // 修复checkExtractedContent方法
  const checkExtractedContent = () => {
    // 使用安全的方式调用可能为undefined的函数
    try {
      const { content } = getExtractedContent();
      
      if (!content || content.trim() === '') {
        toast({
          title: "未找到内容",
          description: "请选择包含文本内容的节点",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("检查内容时出错:", error);
      toast({
        title: "检查内容出错",
        description: "处理节点内容时发生错误",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  };
  
  // 从文本中提取观点
  const extractPerspectivesFromText = (text: string): string[] => {
    // 改进匹配正则表达式，捕获更多格式的观点
    const regexPatterns = [
      /观点\s*\d+\s*[:：]\s*(.*)/g,     // 观点1: 内容
      /^\s*\d+\s*[\.、]\s*(.*)/gm,      // 1. 内容
      /^\s*[（\(][a-zA-Z\d][）\)]\s*(.*)/gm  // (A) 内容
    ];
    
    let allMatches: string[] = [];
    
    // 尝试使用所有正则表达式模式
    for (const regex of regexPatterns) {
      const matches = [...text.matchAll(regex)];
      if (matches.length > 0) {
        // 提取实际的观点内容
        const extractedMatches = matches.map(match => {
          // 如果是观点X: 格式，保留完整格式
          if (match[0].includes('观点') && match[0].includes(':')) {
            return match[0].trim();
          }
          // 否则，提取内容部分并添加标记
          else {
            return `观点: ${match[1].trim()}`;
          }
        });
        allMatches = [...allMatches, ...extractedMatches];
      }
    }
    
    if (allMatches.length > 0) {
      return allMatches.filter((item, index, self) => 
        // 移除重复项
        self.indexOf(item) === index
      );
    }

    // 如果没有匹配到标准格式，尝试按行分割并过滤
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (
        line.includes('观点') ||
        line.includes('支持') ||
        line.includes('反对') ||
        line.includes('中立') ||
        /^\d+\./.test(line) || // 匹配"1."、"2."等开头的行
        /^[\-\*•]/.test(line)  // 匹配"-"、"*"、"•"等列表符号
      ));

    // 确保每一行都包含有效观点
    const validLines = lines.map(line => {
      if (line.includes('观点') && (line.includes(':') || line.includes('：'))) {
        return line; // 已经是标准格式
      } else {
        return `观点: ${line}`; // 添加前缀标记
      }
    });

    return validLines.length > 0 ? validLines : [
      "观点1: 支持该论点，认为这种方法能够有效解决问题",
      "观点2: 部分支持，但对实施过程中的某些环节持保留态度",
      "观点3: 完全反对，认为这种方法从根本上存在缺点",
      "观点4: 提出替代性解决方案，认为有更优的方法",
      "观点5: 质疑前提假设，认为问题定义本身需要重新考虑"
    ];
  };
  
  // 生成多角度观点
  const generatePerspectives = async () => {
    if (!topic.trim()) {
      toast({
        title: "请输入讨论话题",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsGeneratingPerspectives(true);

    try {
      // 首先测试Ollama连接
      const modelToUse = advancedSettings.model || 'qwen2.5:7b';

      console.log(`准备使用模型: ${modelToUse} 生成观点`);

      // 检查Ollama连接和模型可用性
      try {
        // 显示检查连接的提示
        const checkingToast = toast({
          title: "检查模型连接",
          description: `正在检查${modelToUse} 模型是否可用...`,
          status: "loading",
          duration: null,
          isClosable: false,
        });

        // 测试连接 - 使用正确的参数
        const provider = advancedSettings.provider as AIProvider || 'ollama';
        const connectionSuccess = await aiService.testConnection(provider);
        toast.close(checkingToast);

        if (!connectionSuccess) {
          // 提供更详细的错误信息和安装建议
          let errorDescription = `模型 ${modelToUse} 未找到或无法连接`;
          
          let installTip = "";
          if (modelToUse.includes('qwen')) {
            installTip = "可尝试运行: ollama pull qwen2.5:7b";
          } else if (modelToUse.includes('llama')) {
            installTip = "可尝试运行: ollama pull llama3";
          }

          toast({
            title: "模型连接失败",
            description: `${errorDescription}${installTip ? `\n${installTip}` : ''}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setIsGeneratingPerspectives(false);
          return;
        }
      } catch (error) {
        console.error("测试模型连接时出错:", error);
        toast({
          title: "连接测试失败",
          description: error instanceof Error ? error.message : "未知错误",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsGeneratingPerspectives(false);
        return;
      }

      // 获取选中节点的内容
      const contents = ContentExtractor.extractMultipleContents(selectedNodes);
      
      // 提取原始内容用于背景信息
      let backgroundInfo = '';
      if (contents.length > 0) {
        backgroundInfo = contents.map(content => {
          const title = content.title || '节点';
          // 提取更长的内容，以提供更丰富的上下文
          const text = content.text.substring(0, 1000) + (content.text.length > 1000 ? '...' : '');
          return `- ${title}: ${text}`;
        }).join('\n\n');
      }

      // 构建系统提示
      const perspectivesSystemPrompt = `你是一个擅长思辨分析的AI助手，能从多个不同角度看待问题并提出独特的观点。
你的任务是基于用户提供的话题和相关内容，生成多个具有针对性的不同观点。
这些观点应该：
1. 直接基于提供的节点内容，提取其中的关键信息和观点
2. 确保每个观点具有清晰的立场和不同的论证路径
3. 观点之间应该有实质性区别，而不是表达方式的不同
4. 覆盖多个维度的思考，包括支持、反对、折中、质疑前提等不同立场
5. 每个观点必须以"观点X: "格式呈现，确保能被正确提取`;

      // 构建用户提示
      let userPrompt = `请针对以下话题，基于提供的内容，生成5-7个独特的、有深度的思辨性观点。

话题: ${topic}

`;
      
      // 添加背景信息
      if (backgroundInfo) {
        userPrompt += `以下是与话题相关的内容，这些是必须用于分析的关键材料，请仔细阅读并从中提取主要观点和论据:
${backgroundInfo}

`;
      }
      
      userPrompt += `要求:
1. 请直接从提供的内容中提取关键观点，而不是生成通用的、泛泛的看法
2. 每个观点应该有清晰的立场和独特的论证角度
3. 观点之间应有实质性区别，避免仅仅是相似观点的不同表达
4. 每个观点应简明扼要，在两句话以内表达核心观点
5. 确保观点涵盖多种不同立场，而不仅仅是正反两方面
6. 必须以"观点1: "、"观点2: "等格式标记每个观点，确保能够被系统正确提取
7. 如果提供的内容中已有明确观点，请提取并优化，而不是忽略它们`;

      console.log('开始向AI服务发送请求...');

      // 发送请求到AI服务
      const result = await aiService.sendRequest({
        model: modelToUse,
        messages: [
          { role: 'system', content: perspectivesSystemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        provider: advancedSettings.provider as AIProvider,
        stream: false
      });

      console.log('收到AI服务响应:', result);

      // 提取观点
      const extractedPerspectives = extractPerspectivesFromText(result.text);
      
      if (extractedPerspectives.length === 0) {
        throw new Error("无法提取有效的观点");
      }
      
      setPerspectivesList(extractedPerspectives);

      // 不再自动选择所有观点，只预选3个观点（如果有的话）
      const initialSelection = extractedPerspectives.length > 3 
        ? extractedPerspectives.slice(0, 3) 
        : extractedPerspectives;
      setSelectedPerspectives(initialSelection);

      toast({
        title: "成功生成多角度论点",
        description: `已生成${extractedPerspectives.length}个不同视角的观点，请选择要进一步分析的观点`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // 不再自动进入下一步
      // setCurrentStep(2);
    } catch (error) {
      console.error("生成观点失败:", error);

      // 用户友好的错误处理
      let errorMessage = "生成观点时发生错误";
      let errorDetails = "";

      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = "找不到指定的AI模型";
          errorDetails = "请确保已安装相应的模型。使用 'ollama pull 模型名称' 命令安装。";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: errorMessage,
        description: errorDetails,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingPerspectives(false);
    }
  };
  
  // 添加自定义观点
  const addCustomPerspective = () => {
    if (!newPerspective.trim()) return;
    
    const perspective = `自定义观点：${newPerspective}`;
    setCustomPerspectives([...customPerspectives, perspective]);
    
    // 自动选择新添加的观点
    setSelectedPerspectives([...selectedPerspectives, perspective]);
    
    // 重置输入框
    setNewPerspective('');
    
    // 显示成功提示
    toast({
      title: "已添加自定义观点",
      description: "您的观点已添加到列表中并自动选择",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // 处理观点选择
  const togglePerspective = (perspective: string) => {
    if (selectedPerspectives.includes(perspective)) {
      setSelectedPerspectives(selectedPerspectives.filter(p => p !== perspective));
    } else {
      setSelectedPerspectives([...selectedPerspectives, perspective]);
    }
  };
  
  // 测试Ollama连接
  const testOllamaConnection = async () => {
    try {
      setIsTestingOllama(true);
      
      // 显示连接测试中的toast
      const loadingToast = toast({
        title: "测试连接",
        description: "正在测试Ollama连接，请稍等...",
        status: "loading",
        duration: null,
        isClosable: false,
      });
      
      // 记录开始时间
      const startTime = Date.now();
      
      try {
        // 获取选择的模型名
        const modelName = advancedSettings.model || 'qwen2.5:7b';
        
        // 使用aiService测试连接
        const isConnected = await aiService.testOllamaConnection(modelName, true);
        
        // 计算响应时间
        const responseTime = Date.now() - startTime;
        
        if (isConnected) {
          // 关闭加载toast
          toast.close(loadingToast);
          
          // 显示成功toast
          toast({
            title: "连接成功",
            description: `Ollama连接正常! 响应时间: ${responseTime}ms`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          
          // 更新高级设置
          setAdvancedSettings({
            ...advancedSettings,
            provider: 'ollama'
          });
          
          return true;
        } else {
          // 这种情况理论上不应该发生，因为testOllamaConnection在失败时会抛出异常
          toast.close(loadingToast);
          
          toast({
            title: "连接失败",
            description: "无法连接到Ollama服务，请确保服务已启动",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          
          return false;
        }
      } catch (error: any) {
        // 关闭加载toast
        toast.close(loadingToast);
        
        // 处理连接测试过程中的错误
        console.error("Ollama连接测试失败:", error);
        
        // 构造用户友好的错误消息
        let errorMessage = '连接失败: ';
        const modelName = advancedSettings.model || 'qwen2.5:7b'; // 定义modelName
        
        if (error.message.includes('ECONNREFUSED') || error.message.includes('连接被拒绝')) {
          errorMessage += '无法连接到Ollama服务，请确保服务已启动(命令: ollama serve)';
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('超时')) {
          errorMessage += '连接超时，服务响应时间过长';
        } else if (error.message.includes('Network Error') || error.message.includes('网络错误')) {
          errorMessage += '网络错误，请检查Ollama服务状态和网络连接';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage += `找不到模型"${modelName}"，请先下载模型(命令: ollama pull ${modelName})`;
        } else {
          // 使用原始错误消息
          errorMessage = error.message;
        }
        
        toast({
          title: "连接测试失败",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        
        return false;
      }
    } catch (error) {
      console.error("测试连接过程中出错:", error);
      
      toast({
        title: "连接测试失败",
        description: "发生意外错误，请检查控制台日志",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      return false;
    } finally {
      setIsTestingOllama(false);
    }
  };
  
  // 生成辩论分析
  const generateDialecticalAnalysis = async () => {
    if (selectedPerspectives.length < 2) {
      toast({
        title: "请至少选择两个观点进行分析",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setIsGeneratingDebate(true);
    setAnalysisResult('');

    try {
      // 首先测试模型连接
      const modelToUse = advancedSettings.model || 'qwen2.5:7b';

      console.log(`准备使用模型: ${modelToUse} 进行辩论分析`);

      try {
        // 显示检查连接的提示
        const checkingToast = toast({
          title: "检查模型连接",
          description: `正在检查${modelToUse} 模型是否可用...`,
          status: "loading",
          duration: null,
          isClosable: false,
        });
        
        // 测试连接 - 使用正确的参数
        const provider = advancedSettings.provider as AIProvider || 'ollama';
        const connectionSuccess = await aiService.testConnection(provider);
        toast.close(checkingToast);

        if (!connectionSuccess) {
          // 提供更详细的错误信息和安装建议
          let errorDescription = `模型 ${modelToUse} 未找到或无法连接`;
          
          let installTip = "";
          if (modelToUse.includes('qwen')) {
            installTip = "可尝试运行: ollama pull qwen2.5:7b";
          } else if (modelToUse.includes('llama')) {
            installTip = "可尝试运行: ollama pull llama3";
          }
        
        toast({
            title: "模型连接失败",
            description: `${errorDescription}${installTip ? `\n${installTip}` : ''}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      setIsGeneratingDebate(false);
          return;
        }
      } catch (error) {
        console.error("测试模型连接时出错:", error);
      toast({
          title: "连接测试失败",
          description: error instanceof Error ? error.message : "未知错误",
          status: "error",
          duration: 5000,
                isClosable: true,
              });
        setIsGeneratingDebate(false);
        return;
      }

      // 获取选中节点的内容
      const contents = ContentExtractor.extractMultipleContents(selectedNodes);
      
      // 提取原始内容用于背景信息
      let backgroundInfo = '';
      if (contents.length > 0) {
        backgroundInfo = contents.map(content => {
          const title = content.title || '节点';
          const text = content.text.substring(0, 500) + (content.text.length > 500 ? '...' : '');
          return `- ${title}: ${text}`;
        }).join('\n\n');
      }

      // 获取模式样式值（小写）
      const debateStyleValue = debateStyle.toLowerCase();

      // 构建系统提示
      const systemPrompt = `你是一个擅长辩证思考和多视角分析的AI助手。
你的任务是对给定话题和多个不同的观点进行深入分析，比较它们的优缺点，并提供综合的思考。
请使用${debateStyleValue}风格进行分析，让分析更加深入和系统化。
你应该基于用户提供的内容材料进行分析，而不是简单地罗列观点。
你的分析应当为后续多轮辩论做好准备，确保各个观点能够独立地进行更深入的讨论。`;

      // 提取参考材料
      let referenceText = '';
      if (backgroundInfo) {
        referenceText = `\n\n## 参考材料\n${backgroundInfo}`;
      }

      // 构建用户提示
      let userPrompt = `请对以下话题和相关观点进行深入的思辨分析，并准备将分析结果导入到多轮辩论环节：

## 话题
${topic}

## 需要分析的观点
${selectedPerspectives.map((perspective, index) => `${index + 1}. ${perspective}`).join('\n')}
${referenceText}

请你以${debateStyleValue}的方式分析这些观点，要求：

1. 分析每个观点的优缺点、逻辑强度和适用条件
2. 比较不同观点之间的关系，找出它们的共同点和差异点
3. 探讨这些观点在不同情境下的适用性
4. 评估这些观点的理论基础和实践价值
5. 为每个观点准备一个清晰的辩论框架，包括:
   - 主要论点和支持论据
   - 可能面临的质疑和反驳
   - 针对反驳的回应策略
6. 提供一个综合的思考框架，看待这个问题的多个维度
7. 结合参考材料中的具体内容进行深入分析，而不是泛泛而谈
8. 返回使用Markdown格式的分析结果，确保分析结构清晰，便于后续导入多轮辩论`;

      console.log('开始向AI服务发送请求...');

      // 发送请求到AI服务
      const result = await aiService.sendRequest({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: complexityLevel / 5, // 根据复杂度调整温度
        provider: advancedSettings.provider as AIProvider,
        stream: false
      });

      console.log('收到AI服务响应:', result);

      // 设置辩论结果
      setAnalysisResult(result.text);

      toast({
        title: "辩论分析完成",
        description: "成功生成多角度辩论分析",
        status: "success",
                duration: 3000,
                isClosable: true,
              });
          
      // 保存到Neuron
      if (onSaveAnalysis) {
        try {
          const analysisData = {
            topic,
            perspectives: selectedPerspectives,
            analysis: result.text,
            timestamp: new Date().toISOString(),
            model: modelToUse,
            settings: {
              style: debateStyle,
              complexity: complexityLevel
            }
          };

          await onSaveAnalysis(analysisData);
          
        toast({
            title: "分析已保存",
            description: "辩论分析已成功保存到知识库",
        status: "success",
          duration: 3000,
              isClosable: true,
            });
        } catch (saveError) {
          console.error("保存分析结果失败:", saveError);
              toast({
            title: "保存分析失败",
            description: saveError instanceof Error ? saveError.message : "未知错误",
            status: "error",
                duration: 3000,
                isClosable: true,
              });
        }
      }

      // 更新当前步骤
      setCurrentStep(2);

      // 设置说服力最强的观点（暂设为第一个）
      if (selectedPerspectives.length > 0) {
        setPersuasiveView(selectedPerspectives[0]);
      }
      
      // 准备导入到多轮辩论环节
      prepareDialogicalExchange(result.text, selectedPerspectives);
      
    } catch (error) {
      console.error("生成辩论分析失败:", error);
      
      // 用户友好的错误处理
      let errorMessage = "生成辩论分析时发生错误";
      let errorDetails = "";
      
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = "找不到指定的AI模型";
          errorDetails = "请确保已安装相应的模型。使用 'ollama pull 模型名称' 命令安装。";
          } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorMessage,
        description: errorDetails,
        status: "error",
              duration: 5000,
              isClosable: true,
            });
    } finally {
      setIsGeneratingDebate(false);
    }
  };
  
  // 准备多轮辩论函数
  const prepareDialogicalExchange = (analysisText: string, perspectives: string[]) => {
    console.log("准备导入多轮辩论...", { perspectives });
    
    // 创建一个辩论对象
    const debateSession = {
      topic,
      perspectives,
      analysisText,
      rounds: [],
      currentRound: 0,
      status: 'ready',
      createdAt: new Date().toISOString()
    };
    
    // 将辩论会话状态存储起来
    localStorage.setItem('debateSession', JSON.stringify(debateSession));
    
    // 这里可以添加更多处理，比如通知主组件辩论已准备好
    console.log("多轮辩论准备完成", debateSession);
  };
  
  // 初始化多智能体辩论
  const initializeMultiAgentDebate = () => {
    if (selectedPerspectives.length < 2) {
      toast({
        title: "选择的观点不足",
        description: "请至少选择两个观点进行辩论",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 初始化多智能体辩论
    setDebateStatus('idle');
    setCurrentRound(1);
    setDebateRounds([]);
    
    // 为每个观点创建一个位置
    const positions: Record<string, { x: number; y: number }> = {};
    selectedPerspectives.forEach((_, index) => {
      const agentId = `agent-${index}`;
      const angle = 2 * Math.PI * index / selectedPerspectives.length;
      positions[agentId] = {
        x: 50 + 35 * Math.cos(angle), 
        y: 50 + 35 * Math.sin(angle)
      };
    });
    setAgentPositions(positions);

    // 初始化每个Agent的响应数组
    const agentResponsesInit: Record<string, AgentResponse[]> = {};
    selectedPerspectives.forEach((_, index) => {
      const agentId = `agent-${index}`;
      agentResponsesInit[agentId] = [];
    });
    setAgentResponses(agentResponsesInit);
    
    // 清空连接线
    setConnectionLines([]);
    
    // 重置选中的连接
    setSelectedConnection(null);
    
    // 直接进入多智能体辩论步骤
    setCurrentStep(3);
    
    // 向用户显示成功初始化的提示
    toast({
      title: "多智能体辩论已初始化",
      description: `已为${selectedPerspectives.length}个观点创建智能体，准备开始辩论`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    // 短暂延迟后自动开始第一轮辩论
    setTimeout(() => {
      generateDebateRound(1, selectedPerspectives);
    }, 1000);
  };
  
  // 生成辩论轮次
  const generateDebateRound = async (roundNumber: number, perspectives: string[]) => {
    setDebateStatus('generating');
    
    // 创建当前轮次的结构
    const currentRoundData: DebateRound = {
      roundNumber,
      responses: [],
      summary: ""
    };
    
    try {
      // 获取要使用的模型
      const modelToUse = advancedSettings.model || 'qwen2.5:7b';
      
      // 为每个观点生成响应
      const responsePromises = perspectives.map(async (perspective, index) => {
        const agentId = `agent-${index}`;
        
        // 构建系统提示
        const agentSystemPrompt = `你是一个持有"${perspective}"这一观点的智能辩论专家。
你的任务是基于这个观点进行严谨、有逻辑的论证。

请注意：
1. 你需要清晰地表明你的观点论点和立场。
2. 你应该对其他观点做出回应，可以同意、反驳、质疑或扩展它们。
3. 所有引用其他观点的内容必须使用明确的标记，格式为: [引用:观点编号:同意/反驳/质疑/扩展] 引用内容 [/引用]
4. 你的回应必须紧扣主题，论证有力且有逻辑。
5. 你的回应要有一个明确的结构，以便于分析。

这是第${roundNumber}轮讨论，请注意与之前的讨论保持连贯性。`;

        // 构建用户提示
        let userPrompt = `讨论主题: ${topic}\n\n`;
        
        // 添加自己的观点说明
        userPrompt += `你代表的观点: ${perspective}\n\n`;
        
        // 添加其他的观点
        userPrompt += `其他参与讨论的观点包括:\n`;
        perspectives.forEach((p, i) => {
          if (p !== perspective) {
            userPrompt += `观点${i+1}: ${p}\n`;
          }
        });
        
        // 如果不是第一轮，添加之前的讨论内容
        if (roundNumber > 1) {
          userPrompt += `\n之前的讨论内容:\n`;
          debateRounds.forEach(round => {
            userPrompt += `\n==== 第${round.roundNumber}轮 ====\n`;
            round.responses.forEach(response => {
              userPrompt += `${response.perspective}: ${response.response.substring(0, 200)}${response.response.length > 200 ? '...' : ''}\n`;
            });
            userPrompt += `\n总结: ${round.summary}\n`;
          });
        }
        
        // 最终指令
        userPrompt += `\n请基于你的观点，针对当前讨论的主题和其他观点，提供一段有深度的分析和论证。
请确保使用正确的引用格式标注你引用或回应的其他观点：[引用:观点编号:同意/反驳/质疑/扩展] 引用内容 [/引用]
你的回应应该具有说服力、逻辑性，并能推动讨论向前发展。`;

        // 调用AI服务生成观点回应
        const response = await aiService.sendRequest({
          model: modelToUse,
          messages: [
            { role: 'system', content: agentSystemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          provider: 'ollama'
        });
        
        // 解析引用
        const references = extractReferences(response.text, perspectives);
        
        // 存储响应
        const agentResponse: AgentResponse = {
          agentId,
          perspective,
          response: response.text,
          references
        };
        
        return agentResponse;
      });
      
      // 等待所有响应完成
      const allResponses = await Promise.all(responsePromises);
      
      // 更新当前轮次数据
      currentRoundData.responses = allResponses;
      
      // 生成当前轮次的总结
      const summaryPrompt = `你是一个公正的思辨分析专家。请对以下不同观点在本轮讨论中的表现进行简洁的总结。
请特别关注各观点之间的交互，包括共识点、分歧点和逻辑关系。
总结应该客观、平衡，不偏向任何特定观点。

讨论主题: ${topic}

本轮（第${roundNumber}轮）各观点的发言:
${allResponses.map(r => `${r.perspective}:\n${r.response}\n\n`).join('')}

请提供一个不超过300字的本轮讨论总结。`;

      const summaryResponse = await aiService.sendRequest({
        model: modelToUse,
        messages: [
          { role: 'system', content: '你是一个客观公正的讨论总结专家。请提供简明扼要的总结。' },
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3,
        provider: 'ollama'
      });
      
      // 更新总结
      currentRoundData.summary = summaryResponse.text;
      
      // 提取并设置连接线
      const newConnectionLines = extractConnectionLines(allResponses);
      setConnectionLines(prev => [...prev, ...newConnectionLines]);
      
      // 更新辩论轮次
      setDebateRounds(prev => [...prev, currentRoundData]);
      
      // 更新每个Agent的响应
      allResponses.forEach(response => {
        setAgentResponses(prev => ({
          ...prev,
          [response.agentId]: [...(prev[response.agentId] || []), response]
        }));
      });
      
      // 更新辩论状态
      setDebateStatus(autoAdvance ? 'generating' : 'paused');
      
      // 如果设置了自动推进，且还没有达到最大轮次（设置为5轮），则继续下一轮
      if (autoAdvance && roundNumber < 5) {
        setTimeout(() => {
          setCurrentRound(roundNumber + 1);
          generateDebateRound(roundNumber + 1, perspectives);
        }, 3000); // 短暂延迟，让用户有时间察看结果
      }
    } catch (error) {
      console.error("生成辩论轮次失败:", error);
      
      toast({
        title: "生成辩论轮次失败",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      setDebateStatus('paused');
    }
  };
  
  // 从响应中提取引用
  const extractReferences = (responseText: string, perspectives: string[]): AgentResponse['references'] => {
    const references: AgentResponse['references'] = [];
    
    // 匹配引用格式 [引用:观点编号:类型] 内容 [/引用]
    const regex = /\[引用:观点(\d+):(同意|反驳|质疑|扩展)\](.*?)\[\/引用\]/gs;
    let match;
    
    while ((match = regex.exec(responseText)) !== null) {
      const perspectiveIndex = parseInt(match[1]) - 1;
      if (perspectiveIndex >= 0 && perspectiveIndex < perspectives.length) {
        const targetAgentId = `agent-${perspectiveIndex}`;
        
        // 将中文类型映射到英文类型
        const typeMap: {[key: string]: 'agree' | 'disagree' | 'question' | 'extension'} = {
          '同意': 'agree',
          '反驳': 'disagree',
          '质疑': 'question',
          '扩展': 'extension'
        };
        
        references.push({
          targetAgentId,
          type: typeMap[match[2]] || 'question',
          text: match[3].trim()
        });
      }
    }
    
    return references;
  };
  
  // 提取连接线
  const extractConnectionLines = (responses: AgentResponse[]) => {
    const lines: {
      sourceId: string;
      targetId: string;
      type: 'agree' | 'disagree' | 'question' | 'extension';
    }[] = [];
    
    responses.forEach(response => {
      response.references.forEach(ref => {
        lines.push({
          sourceId: response.agentId,
          targetId: ref.targetAgentId,
          type: ref.type
        });
      });
    });
    
    return lines;
  };
  
  // 继续下一轮辩论
  const continueDebate = () => {
    if (debateStatus !== 'paused') return;
    
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    generateDebateRound(nextRound, selectedPerspectives);
  };
  
  // 完成辩论并生成思维导图
  const finishDebateAndGenerateMindMap = async () => {
    setDebateStatus('completed');
    
    // 为每个轮次的总结创建节点
    const nodes: INode[] = [];
    
    // 创建中心话题节点
    const centerNodeId = `debate-topic-${Date.now()}`;
    nodes.push({
      id: centerNodeId,
        type: 'debate',
      position: { x: 500, y: 300 },
        data: {
        title: `多视角辩论：${topic}`,
        content: `主题：${topic}\n\n参与视角：${selectedPerspectives.join('、')}`,
          perspectives: selectedPerspectives,
        debateRounds: debateRounds.length
      },
      connectedTo: []
    });
    
    // 为每个观点创建节点
    const perspectiveNodes = selectedPerspectives.map((perspective, index) => {
      const nodeId = `debate-perspective-${Date.now()}-${index}`;
      const angle = (index / selectedPerspectives.length) * 2 * Math.PI;
      const x = 500 + 200 * Math.cos(angle);
      const y = 300 + 200 * Math.sin(angle);
      
      return {
        id: nodeId,
        type: 'debate',
        position: { x, y },
        data: {
          title: `视角 ${index + 1}`,
          content: perspective,
          perspective: perspective,
          type: 'perspective'
        },
        connectedTo: [centerNodeId]
      };
    });
    
    nodes.push(...perspectiveNodes);
    
    // 为每轮辩论创建总结节点
    debateRounds.forEach((round, roundIndex) => {
      const nodeId = `debate-round-${Date.now()}-${roundIndex}`;
      const angle = ((roundIndex + perspectiveNodes.length) / (debateRounds.length + perspectiveNodes.length)) * 2 * Math.PI;
      const x = 500 + 350 * Math.cos(angle);
      const y = 300 + 350 * Math.sin(angle);
      
      nodes.push({
        id: nodeId,
        type: 'debate',
        position: { x, y },
        data: {
          title: `第 ${round.roundNumber} 轮总结`,
          content: round.summary,
          round: round.roundNumber,
          type: 'summary'
        },
        connectedTo: [centerNodeId]
      });
      
      // 创建具有关键引用的节点
      round.responses.forEach((response, responseIndex) => {
        if (response.references.length > 0) {
          response.references.forEach((ref, refIndex) => {
            const refNodeId = `debate-ref-${Date.now()}-${roundIndex}-${responseIndex}-${refIndex}`;
            const refAngle = angle + (0.1 * (refIndex + 1 - response.references.length / 2));
            const refX = x + 150 * Math.cos(refAngle);
            const refY = y + 150 * Math.sin(refAngle);
            
            const targetPerspectiveIndex = parseInt(ref.targetAgentId.split('-')[1]);
            const targetPerspective = selectedPerspectives[targetPerspectiveIndex];
            const refType = ref.type === 'agree' ? '支持' : 
                         ref.type === 'disagree' ? '反驳' : 
                         ref.type === 'question' ? '质疑' : '扩展';
            
            nodes.push({
              id: refNodeId,
              type: 'debate',
              position: { x: refX, y: refY },
              data: {
                title: `${refType}：${response.perspective} → ${targetPerspective}`,
                content: ref.text,
                type: 'reference',
                refType: ref.type,
                round: round.roundNumber
              },
              connectedTo: [nodeId]
            });
          });
        }
      });
    });
    
    // 将节点添加到画布
    for (const node of nodes) {
      if (onAddNode) {
        await onAddNode(node);
        // 短暂延迟，确保节点添加顺序正确
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 保存分析结果
    if (onSaveAnalysis) {
      const analysisData = {
        topic,
        perspectives: selectedPerspectives,
        rounds: debateRounds,
        timestamp: new Date().toISOString(),
        nodeIds: nodes.map(node => node.id)
      };
      
      await onSaveAnalysis(analysisData);
    }
    
    // 显示成功通知
      toast({
      title: "辩论分析已完成",
      description: "思维导图已生成并添加到画布中",
        status: "success",
      duration: 5000,
        isClosable: true,
      });
      
    // 关闭辩论助手
      onClose();
  };
  
  // 修改高级设置渲染部分
  const renderAdvancedSettings = () => {
    return (
      <Box>
        <Card variant="outline" mb={4}>
          <CardHeader>
            <Heading size="sm">模型设置</Heading>
          </CardHeader>
          <CardBody>
            <FormControl mb={4}>
              <FormLabel>选择AI模型</FormLabel>
              <Select 
                value={advancedSettings.model} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setAdvancedSettings({
                    ...advancedSettings,
                    model: e.target.value
                  })
                }
              >
                <option value="">默认 (Qwen 2.5 7B)</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </Select>
              <FormHelperText>
                选择用于生成辩论内容的AI模型
              </FormHelperText>
            </FormControl>
        
            <FormControl mb={4}>
              <FormLabel>复杂度级别: {complexityLevel}</FormLabel>
              <Slider 
                value={complexityLevel} 
                min={1} 
                max={5} 
                step={1}
                onChange={(val) => setComplexityLevel(val)}
                mb={2}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>
          </CardBody>
        </Card>
      </Box>
    );
  };

  // 重新设计renderPerspectiveGenerationStep函数，添加分析类型选择
  const renderPerspectiveGenerationStep = () => {
    return (
      <VStack spacing={6} align="stretch" mt={4}>
        <Box>
          <Text fontWeight="medium" mb={2}>探讨话题</Text>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="输入您想要进行辩证式思考的话题..."
            size="md"
            mb={4}
          />
          
          {/* 显示选中的节点信息 */}
          {selectedNodes.length > 0 && (
            <Box mb={4}>
              <Text fontWeight="medium" mb={2}>已选内容：</Text>
              <SimpleGrid columns={[1, 2]} spacing={4} mb={3}>
                {selectedNodes.map(node => {
                  // 使用ContentExtractor提取节点内容
                  const extractedContent = ContentExtractor.extractContent(node);
                  
                  return (
                    <Box 
                      key={node.id} 
                      borderWidth="1px" 
                      borderRadius="md" 
                      overflow="hidden" 
                      p={3}
                      bg={useColorModeValue('gray.50', 'gray.800')}
                    >
                      <Text fontWeight="bold" mb={1} noOfLines={1}>{extractedContent.title || '未命名节点'}</Text>
                      <Text fontSize="sm" noOfLines={2} color={useColorModeValue('gray.600', 'gray.400')}>
                        {extractedContent.text.substring(0, 100)}
                        {extractedContent.text.length > 100 ? '...' : ''}
                      </Text>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          )}
              
          <Box mb={6}>
            <Flex justify="space-between" align="center">
              <HStack>
                <Button
                  colorScheme="purple"
                  leftIcon={<Icon as={FiZap} />}
                  onClick={generatePerspectives}
                  isLoading={isGeneratingPerspectives}
                  loadingText="生成中..."
                  isDisabled={!topic.trim()}
                >
                  生成多元视角
                </Button>
                <IconButton
                  aria-label="高级设置"
                  icon={<Icon as={FiSettings} />}
                  variant="outline"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                />
              </HStack>
            </Flex>
          </Box>
          
          {/* 高级设置折叠面板 */}
          <Collapse in={isSettingsOpen} animateOpacity>
            {renderAdvancedSettings()}
          </Collapse>
        </Box>
        
        {/* 观点选择区域 - 改进为卡片式UI */}
        {perspectivesList.length > 0 && (
          <Box borderWidth="1px" borderRadius="lg" p={4} bg={useColorModeValue('gray.50', 'gray.700')}>
            <Flex justify="space-between" align="center" mb={3}>
              <VStack align="start" spacing={0}>
                <Heading size="md" color="purple.600">选择思辨视角</Heading>
                <Text fontSize="sm" color="gray.600">
                  已选择 <Badge colorScheme="purple">{selectedPerspectives.length}</Badge> / {perspectivesList.length} 个观点
                  {selectedPerspectives.length < 2 && (
                    <Text as="span" color="red.500" ml={1}>（至少选择2个观点）</Text>
                  )}
                </Text>
              </VStack>
              
              <HStack>
                <Tooltip label="选择全部视角" placement="top">
                  <Button
                    size="xs" 
                    onClick={() => setSelectedPerspectives(perspectivesList)}
                    variant="outline"
                  >
                    全选
                  </Button>
                </Tooltip>
                <Tooltip label="取消所有选择" placement="top">
                  <Button
                    size="xs"
                    onClick={() => setSelectedPerspectives([])}
                    variant="outline"
                  >
                    清除
                  </Button>
                </Tooltip>
              </HStack>
            </Flex>
            
            <SimpleGrid columns={[1, null, 2]} spacing={3} mb={4}>
              {perspectivesList.map((perspective, index) => {
                const isSelected = selectedPerspectives.includes(perspective);
                return (
                  <Box 
                    key={index}
                    borderWidth="2px" 
                    borderRadius="md" 
                    p={3}
                    bg={isSelected ? highlightBg : bgColor}
                    borderColor={isSelected ? 'purple.400' : borderColor}
                    cursor="pointer"
                    onClick={() => togglePerspective(perspective)}
                    _hover={{ boxShadow: 'md', borderColor: isSelected ? 'purple.500' : 'gray.300' }}
                    position="relative"
                    transition="all 0.2s"
                  >
                    {isSelected && (
                      <Badge
                        position="absolute"
                        top="-8px"
                        right="-8px"
                        colorScheme="purple"
                        borderRadius="full"
                        size="sm"
                      >
                        已选
                      </Badge>
                    )}
                    <Text>{perspective}</Text>
                  </Box>
                );
              })}
            </SimpleGrid>
            
            {/* 添加自定义观点 */}
            <Box mt={4}>
              <Text fontSize="sm" fontWeight="medium" mb={2}>添加自定义观点</Text>
              <HStack>
                <Input 
                  placeholder="输入您的观点..." 
                  value={newPerspective}
                  onChange={(e) => setNewPerspective(e.target.value)}
                  size="md"
                />
                <Button
                  colorScheme="purple"
                  variant="outline"
                  onClick={addCustomPerspective}
                  isDisabled={!newPerspective.trim()}
                >
                  添加
                </Button>
              </HStack>
            </Box>
            
            {/* 清晰的提示和下一步指引 */}
            <Box 
              mt={6} 
              p={3} 
              borderWidth="1px" 
              borderRadius="md" 
              bg={useColorModeValue('purple.50', 'purple.900')}
              borderStyle="dashed"
            >
              <Text fontSize="sm" mb={2}>
                <Icon as={FiInfo} mr={2} />
                请从上方选择您希望进一步分析的观点，然后点击下方按钮继续
              </Text>
              
              {/* 分析类型选择区域 - 仅在选择了足够观点后显示 */}
              {selectedPerspectives.length >= 2 ? (
                <Button
                  mt={2}
                  colorScheme="purple"
                  width="100%"
                  onClick={() => setIsShowingOptions(true)}
                  leftIcon={<Icon as={FiGitBranch} />}
                >
                  继续分析选中的 {selectedPerspectives.length} 个观点
                </Button>
              ) : (
                <Button
                  mt={2}
                  colorScheme="purple"
                  width="100%"
                  isDisabled
                  opacity={0.7}
                >
                  请至少选择2个观点继续
                </Button>
              )}
            </Box>
          </Box>
        )}
      </VStack>
    );
  };
        
  // 改进辩论结果显示界面
  const renderDialecticalAnalysisStep = () => {
        return (
          <VStack spacing={6} align="stretch" mt={4}>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg={useColorModeValue('gray.50', 'gray.700')}>
          <Heading size="md" mb={3} color="purple.600">思辨分析结果</Heading>

                  <Box 
                    borderWidth="1px" 
                    borderRadius="md" 
                    p={4} 
            bg={bgColor}
            borderColor={borderColor}
            position="relative"
          >
            {isGeneratingDebate ? (
              <Flex direction="column" align="center" justify="center" py={10}>
                <Spinner size="xl" color="purple.500" mb={4} />
                <Text>正在生成辩论分析...</Text>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  这可能需要一些时间，取决于观点数量和复杂度
                </Text>
              </Flex>
            ) : analysisResult ? (
              <>
                <Box
                  className="markdown-content"
                  sx={{
                    h1: { fontSize: "xl", fontWeight: "bold", mt: 4, mb: 2 },
                    h2: { fontSize: "lg", fontWeight: "bold", mt: 3, mb: 2 },
                    h3: { fontSize: "md", fontWeight: "bold", mt: 2, mb: 1 },
                    p: { mb: 3 },
                    ul: { pl: 5, mb: 3 },
                    ol: { pl: 5, mb: 3 },
                    li: { mb: 1 },
                    blockquote: {
                      borderLeftWidth: "2px",
                      borderLeftColor: "gray.200",
                      pl: 3,
                      py: 1,
                      my: 2,
                      fontStyle: "italic"
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: marked.parse(analysisResult) }}
                />
                
                {/* 添加进入多智能体辩论的按钮 */}
                <Box mt={6} borderTopWidth="1px" pt={4} textAlign="center">
                  <Text mb={3} fontWeight="medium">深入探讨这些观点？</Text>
                  <Button 
                    leftIcon={<Icon as={FiGitBranch} />} 
                    colorScheme="purple" 
                    size="md"
                    onClick={initializeMultiAgentDebate}
                  >
                    启动多智能体辩论
                  </Button>
                  <Text mt={2} fontSize="sm" color="gray.500">
                    多智能体辩论将让不同观点相互交流，形成更深入的讨论
                  </Text>
                  </Box>
              </>
            ) : (
              <Flex direction="column" align="center" justify="center" py={10}>
                <Text color="gray.500">请先选择视角并生成分析</Text>
              </Flex>
            )}
          </Box>
          
          {/* 辩论画布 - 显示所有被选中的观点 */}
          <Box mt={6}>
            <Heading size="md" mb={3} color="purple.600">思辨视角</Heading>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {selectedPerspectives.map((perspective, index) => (
                <Box 
                  key={index}
                  p={3}
                    borderWidth="1px" 
                    borderRadius="md" 
                  borderColor={perspective === persuasiveView ? 'purple.400' : 'gray.200'}
                  bg={perspective === persuasiveView ? 'purple.50' : 'white'}
                  _hover={{ boxShadow: 'md' }}
                  cursor="pointer"
                  onClick={() => conductFocusedPerspectiveAnalysis(perspective)}
                >
                  <Text fontWeight={perspective === persuasiveView ? 'bold' : 'normal'}>
                    {perspective}
                  </Text>
                  {perspective === persuasiveView && (
                    <Badge colorScheme="purple" mt={2}>最具洞察力</Badge>
                  )}
                  </Box>
              ))}
            </SimpleGrid>
          </Box>
          
          {/* 多轮互动区域 */}
          <Box mt={6}>
            <Heading size="md" mb={3} color="purple.600">思辨对话</Heading>
            
            {/* 显示已有的问答 */}
            {dialogueHistory.map((dialogue, index) => (
              <Box key={index} mb={4}>
                <Box p={3} bg="purple.50" borderRadius="md" mb={2}>
                  <Text fontWeight="bold">{dialogue.question}</Text>
                </Box>
                <Box
                  p={3}
                borderWidth="1px" 
                borderRadius="md" 
                  dangerouslySetInnerHTML={{ __html: marked(dialogue.answer) }}
                  className="markdown-content"
                bg={bgColor} 
                />
              </Box>
            ))}
            
            {/* 用户输入区域 */}
            <Box mt={4}>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="提出您的问题或分享您的思考..."
                size="md"
                mb={2}
                rows={4}
              />
              
              <Flex justify="space-between">
                <Button
                  colorScheme="gray"
                  variant="outline"
                  leftIcon={<AddIcon />}
                    size="sm"
                  onClick={() => {
                    if (userInput.trim()) {
                      addUserResponse("自定义回应");
                    }
                  }}
                  isDisabled={!userInput.trim()}
                >
                  添加自己的思考
                </Button>
                
                <Button
                  colorScheme="purple"
                    size="sm"
                  onClick={processUserDialogueInput}
                  isLoading={isProcessingInput}
                  loadingText="正在分析"
                  isDisabled={!userInput.trim()}
                >
                  发送问题
                </Button>
              </Flex>
            </Box>
            </Box>
            
          {/* 添加进入多智能体辩论的按钮 */}
          <Box mt={8} p={4} borderWidth="1px" borderRadius="lg" bg="purple.50">
            <Heading size="md" mb={3} color="purple.600">多智能体辩论模式</Heading>
            <Text mb={4}>启动多智能体辩论模式，为每个观点分配独立的AI智能体，体验更深入的思辨对话。</Text>
            <Button 
              colorScheme="purple" 
              leftIcon={<BellIcon />}
              onClick={initializeMultiAgentDebate}
              isDisabled={selectedPerspectives.length < 2}
            >
              启动多智能体辩论
                </Button>
            {selectedPerspectives.length < 2 && (
              <Text fontSize="sm" color="red.500" mt={2}>
                请至少选择两个观点才能启动多智能体辩论
              </Text>
            )}
          </Box>
        </Box>
      </VStack>
    );
  };

  // 添加获取本地模型列表的函数
  const fetchLocalModels = async () => {
    try {
      console.log("获取本地模型列表...");
      // 显示加载提示
      const loadingToast = toast({
        title: "检查本地模型",
        description: "正在从Ollama获取可用模型列表...",
        status: "loading",
        duration: null,
        isClosable: false,
      });
      
      // 使用aiService的方法获取可用模型
      let localModels: ModelOption[] = [];
      try {
        // 使用类型断言来避免类型错误
        const models = await aiService.getAvailableModels();
        if (Array.isArray(models) && models.length > 0) {
          // 筛选Ollama提供商的模型
          const ollamaModels = models.filter((model: any) => {
            if (typeof model === 'object' && model.provider === 'ollama') {
              return true;
            }
            if (typeof model === 'string') {
              // 使用字符串的includes方法检查
              return String(model).includes(':');
            }
            return false;
          });
          
          localModels = ollamaModels.map((model: any) => {
            if (typeof model === 'string') {
              return {
                id: model,
                name: model,
                type: 'local' as const,
                provider: 'ollama',
                description: `Ollama本地模型`
              };
            } else {
              return {
                id: typeof model.id === 'string' ? model.id : '',
                name: typeof model.name === 'string' ? model.name : '',
                type: 'local' as const,
                provider: 'ollama',
                description: `Ollama本地模型`
              };
            }
          });
        }
      } catch (error) {
        console.error("获取Ollama模型失败:", error);
      }
      
      // 关闭加载提示
      toast.close(loadingToast);
      
      // 更新检测到的本地模型列表
      setDetectedLocalModels(localModels);
      
      // 如果有本地模型，显示成功提示
      if (localModels.length > 0) {
        toast({
          title: "已获取本地模型",
          description: `发现${localModels.length}个Ollama本地模型`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // 如果没有发现本地模型，显示警告
        toast({
          title: "未找到本地模型",
          description: "请确保Ollama已启动并安装了模型",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("获取本地模型列表失败:", error);
      toast({
        title: "获取模型列表失败",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 在组件加载时尝试获取本地模型列表
  useEffect(() => {
    if (isOpen) {
      fetchLocalModels();
    }
  }, [isOpen]);

  // 优化多智能体辩论渲染函数
  const renderMultiAgentDebateStep = () => {
    // 使用全屏宽度，相对高度
    const canvasHeight = "78vh"; // 设置更高的画布高度
    
    return (
      <VStack spacing={6} align="stretch" mt={2} width="100%">
        <Box position="relative" borderWidth="1px" borderRadius="lg" p={4} bg={useColorModeValue('gray.50', 'gray.700')} width="100%">
          <Heading size="md" mb={4} color="purple.600">多智能体辩论 - 第 {currentRound} 轮</Heading>

          {/* 辩论控制区 */}
          <HStack spacing={4} mb={4} justifyContent="space-between" flexWrap="wrap">
            <Box>
              <Text fontWeight="bold">主题：{topic}</Text>
              <Text fontSize="sm" color="gray.600">已选择 {selectedPerspectives.length} 个观点进行辩论</Text>
            </Box>
            <HStack spacing={2}>
              <ButtonGroup size="sm" isAttached variant="outline">
                <Button
                  leftIcon={<Icon as={FiArrowLeft} />}
                  isDisabled={currentRound <= 1 || debateStatus === 'generating'}
                  onClick={() => setCurrentRound(Math.max(1, currentRound - 1))}
                >
                  上一轮
                </Button>
                <Button
                  rightIcon={<Icon as={FiGitBranch} />}
                  isDisabled={debateStatus === 'generating'}
                  onClick={continueDebate}
                >
                  下一轮
                </Button>
              </ButtonGroup>

              <Button
                colorScheme="green"
                isDisabled={debateStatus === 'generating' || debateRounds.length === 0}
                onClick={finishDebateAndGenerateMindMap}
                size="sm"
              >
                完成并生成思维导图
              </Button>
            </HStack>
          </HStack>

          {/* 多边形圆桌区域 - 设置为响应式大小 */}
          <Box
            position="relative"
            width="100%"
            height={canvasHeight}
            bg={useColorModeValue('gray.100', 'gray.800')}
            borderRadius="lg"
            overflow="hidden"
            borderWidth="1px"
            borderColor={borderColor}
          >
            {/* 中心轮次总结区域 */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width="40%"
              maxHeight="60%"
              bg={bgColor}
              borderRadius="lg"
              p={4}
              overflow="auto"
              boxShadow="md"
              borderWidth="1px"
              borderColor="purple.200"
              zIndex={1}
            >
              {debateRounds.length > 0 && currentRound <= debateRounds.length ? (
                <>
                  <Heading size="sm" mb={3} color="purple.500" textAlign="center">
                    第 {currentRound} 轮总结
                  </Heading>
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: debateRounds[currentRound - 1]?.summary
                        ? marked.parse(debateRounds[currentRound - 1].summary)
                        : '<p>正在生成总结...</p>'
                    }}
                    className="markdown-content"
                    sx={{
                      '& *': {
                        margin: '0.5rem 0',
                      },
                      '& ul, & ol': {
                        paddingLeft: '1.5rem',
                      },
                      maxHeight: '50vh',
                      overflowY: 'auto'
                    }}
                  />
                </>
              ) : (
                <Flex justify="center" align="center" height="100%" direction="column">
                  <Icon as={FiGitBranch} boxSize={10} color="gray.400" mb={2} />
                  <Text color="gray.500" textAlign="center">辩论尚未开始<br />请点击"下一轮"开始</Text>
                </Flex>
              )}
            </Box>

            {/* SVG连接线 */}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
              {/* 连接线在这里渲染 */}
              {renderConnectionLines()}
            </svg>

            {/* 观点位置和内容 */}
            {renderAgentPositions()}
          </Box>

          {/* 辩论状态和信息 */}
          <Box mt={4} p={3} borderWidth="1px" borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
            <Flex justify="space-between" align="center" wrap="wrap">
              <HStack>
                <Text fontWeight="bold">
                  状态: {
                    debateStatus === 'idle' ? '准备就绪' :
                    debateStatus === 'generating' ? '正在生成...' :
                    debateStatus === 'completed' ? '已完成' : '进行中'
                  }
                </Text>
                {debateRounds.length > 0 && (
                  <Badge colorScheme="purple" ml={2}>
                    已完成 {debateRounds.length} 轮
                  </Badge>
                )}
              </HStack>
              <HStack>
                <Button
                  size="sm"
                  leftIcon={<Icon as={FiSave} />}
                  colorScheme="purple"
                  variant="outline"
                  isDisabled={debateRounds.length === 0}
                  onClick={() => {
                    // 导出辩论记录到Markdown文件
                    const markdown = debateRounds.map((round, idx) => {
                      return `## 第${idx + 1}轮\n\n### 总结\n\n${round.summary}\n\n### 智能体回应\n\n${
                        round.responses.map(r => `#### ${r.perspective}\n\n${r.response}\n\n`).join('')
                      }`;
                    }).join('\n\n---\n\n');
                    
                    const blob = new Blob([markdown], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `辩论-${topic}-${new Date().toISOString().split('T')[0]}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    toast({
                      title: "辩论已导出",
                      description: "辩论记录已下载为Markdown文件",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                >
                  导出辩论记录
                </Button>
                
                {/* 添加图例按钮 */}
                <Tooltip label="查看连接线图例" placement="top">
                  <IconButton
                    aria-label="查看图例"
                    icon={<Icon as={FiInfo} />}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      // 显示连接线图例
                      toast({
                        title: "连接线图例",
                        description: (
                          <VStack align="start" spacing={2} mt={2}>
                            <Flex align="center">
                              <Box w="20px" h="2px" bg="green.400" mr={2} />
                              <Text>支持</Text>
                            </Flex>
                            <Flex align="center">
                              <Box w="20px" h="2px" bg="red.400" mr={2} />
                              <Text>反驳</Text>
                            </Flex>
                            <Flex align="center">
                              <Box w="20px" h="2px" bg="blue.400" mr={2} strokeDasharray="5,5" style={{ borderStyle: 'dashed' }} />
                              <Text>质疑</Text>
                            </Flex>
                            <Flex align="center">
                              <Box w="20px" h="2px" bg="purple.400" mr={2} />
                              <Text>扩展</Text>
                            </Flex>
                          </VStack>
                        ),
                        status: "info",
                        duration: 10000,
                        isClosable: true,
                        position: "top-right",
                      });
                    }}
                  />
                </Tooltip>
              </HStack>
            </Flex>
          </Box>
        </Box>
      </VStack>
    );
  };

  // 根据步骤渲染内容，更优雅的函数名
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPerspectiveGenerationStep();
      case 2:
        return renderDialecticalAnalysisStep();
      case 3:
        return renderMultiAgentDebateStep();
      default:
        return null;
    }
  };
  
  // 添加用户响应函数 - 修改参数名称以匹配状态类型
  const addUserResponse = (userQuestion: string) => {
    // 添加用户响应，使用正确的属性名
    setDialogueHistory([...dialogueHistory, {
      question: `关于观点: ${userQuestion}`,
      answer: userInput
    }]);
    
    // 清空输入
    setUserInput('');
    
    toast({
      title: "已添加您的思考",
      status: "success",
      duration: 2000,
      isClosable: true
    });
  };

  // 深入分析特定观点，更专业的命名
  const conductFocusedPerspectiveAnalysis = async (perspective: string) => {
    if (!perspective) return;
    
    setIsProcessingInput(true);
    
    try {
      const modelToUse = advancedSettings.model || 'qwen2.5:7b';
      
      const systemPrompt = `你是一个擅长辩证思考和多角度分析的AI助手，正在进行深度对话式思考。
基于之前的思辨分析，你需要针对用户询问的特定观点进行深入探究，提供更详细的论证、反驳和支持证据。`;
      
      const userPrompt = `我想深入了解以下观点：${perspective}

请提供：
1. 这个观点的核心论点分析
2. 支持这个观点的关键论据和证据
3. 可能面临的主要反驳意见
4. 如何应对这些反驳
5. 这个观点在哪些情况下最为适用

背景上下文：我们正在讨论的话题是"${topic}"，先前分析的完整内容如下：
${analysisResult.substring(0, 2000)}`;
      
      const result = await aiService.sendRequest({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        provider: advancedSettings.provider as AIProvider,
        stream: false
      });
      
      setDialogueHistory(prev => [...prev, {
        question: `关于观点：${perspective}`,
        answer: result.text
      }]);
      
      toast({
        title: "分析完成",
        description: `已完成对"${perspective.substring(0, 30)}..."的深入探究`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("深入分析失败:", error);
      toast({
        title: "分析失败",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProcessingInput(false);
    }
  };
  
  // 处理用户对话输入
  const processUserDialogueInput = async () => {
    if (!userInput.trim()) return;
    
    setIsProcessingInput(true);
    
    try {
      const modelToUse = advancedSettings.model || 'qwen2.5:7b';
      
      const systemPrompt = `你是一个擅长辩证思考和多角度分析的AI助手，正在进行深度对话式思考。
基于之前的思辨分析，你需要针对用户的问题提供富有见解的回应，融合多个视角的观点。`;
      
      // 构建对话上下文
      let contextText = `话题：${topic}\n\n思辨分析内容：\n${analysisResult.substring(0, 1000)}...\n\n`;
      
      // 添加之前的对话历史
      if (dialogueHistory.length > 0) {
        contextText += "之前的对话：\n";
        dialogueHistory.forEach((dialogue, index) => {
          contextText += `问：${dialogue.question}\n答：${dialogue.answer.substring(0, 200)}...\n\n`;
        });
      }
      
      const userPrompt = `${contextText}\n用户问题：${userInput}\n\n请提供一个深思熟虑、多角度的回应，帮助用户更深入地理解这个话题。`;
      
      const result = await aiService.sendRequest({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        provider: 'ollama'
      });
      
      // 更新对话历史
      setDialogueHistory([...dialogueHistory, {
        question: userInput,
        answer: result.text
      }]);
      
      // 清空输入
      setUserInput('');
      
      toast({
        title: "回应已生成",
        status: "success",
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error("回应生成失败:", error);
      toast({
        title: "回应生成失败",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProcessingInput(false);
    }
  };
  
  // 添加渲染连接线的函数
  const renderConnectionLines = (): JSX.Element[] => {
    // 获取当前轮次数据
    const currentRoundData = debateRounds.find(r => r.roundNumber === currentRound) || {
      roundNumber: currentRound,
      responses: [],
      summary: ""
    };

    // 不同类型连接线的颜色
    const connectionColors = {
      agree: 'green.400',
      disagree: 'red.400',
      question: 'blue.400',
      extension: 'purple.400'
    };
    
    // 连接线类型的中文描述
    const connectionTypeLabels = {
      agree: '支持',
      disagree: '反驳',
      question: '质疑',
      extension: '扩展'
    };
    
    return connectionLines.filter(line => {
      // 只显示当前轮次的连接线
      const sourceAgent = Object.values(agentResponses).flat().find(r => r.agentId === line.sourceId);
      return sourceAgent && debateRounds.find(round => 
        round.roundNumber === currentRound && 
        round.responses.some(r => r.agentId === line.sourceId)
      );
    }).map((line, index) => {
      const sourcePos = agentPositions[line.sourceId] || { x: 0, y: 0 };
      const targetPos = agentPositions[line.targetId] || { x: 0, y: 0 };
      const isSelected = selectedConnection === `${line.sourceId}-${line.targetId}-${index}`;
      const color = connectionColors[line.type as keyof typeof connectionColors];
      
      // 计算控制点，使线条弯曲
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
  
  return (
        <g key={`connection-${index}`}>
          <path
            d={`M ${sourcePos.x} ${sourcePos.y} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}`}
            stroke={isSelected ? `var(--chakra-colors-${color.replace('.', '-')})` : `var(--chakra-colors-${color.replace('.', '-')})`}
            strokeWidth={isSelected ? 3 : 2}
            strokeOpacity={isSelected ? 1 : 0.7}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={line.type === 'question' ? "5,5" : "none"}
            onClick={() => setSelectedConnection(`${line.sourceId}-${line.targetId}-${index}`)}
            style={{ cursor: 'pointer' }}
          />
          
          {/* 连接线类型标签 */}
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            fill={`var(--chakra-colors-${color.replace('.', '-')})`}
            fontSize="12"
            fontWeight="bold"
            pointerEvents="none"
          >
            {connectionTypeLabels[line.type as keyof typeof connectionTypeLabels]}
          </text>
        </g>
      );
    });
  };

  // 优化renderAgentPositions函数
  const renderAgentPositions = (): JSX.Element[] => {
    // 获取当前轮次数据
    const currentRoundData = debateRounds.find(r => r.roundNumber === currentRound) || {
      roundNumber: currentRound,
      responses: [],
      summary: ""
    };
    
    // 计算位置的辅助函数 - 优化多边形布局
    const calculatePosition = (index: number, total: number) => {
      const radius = total <= 4 ? 32 : total <= 6 ? 35 : 38; // 根据观点数量调整半径
      const angle = (2 * Math.PI * index / total) - Math.PI / 2; // 从顶部开始
      
      return {
        x: 50 + radius * Math.cos(angle), // 中心点 + 半径 * cos(角度)
        y: 50 + radius * Math.sin(angle)  // 中心点 + 半径 * sin(角度)
      };
    };
    
    return selectedPerspectives.map((perspective, index) => {
      const agentId = `agent-${index}`;
      const position = calculatePosition(index, selectedPerspectives.length);
      
      // 当前Agent在当前轮次的响应
      const currentAgentResponse = currentRoundData.responses.find(r => r.agentId === agentId);
      const responseText = currentAgentResponse?.response || '';
      
      // 根据观点数量动态调整宽度
      const boxWidth = selectedPerspectives.length <= 4 ? "280px" : "240px";
      
      return (
        <Box
          key={agentId}
          position="absolute"
          top={`${position.y}%`}
          left={`${position.x}%`}
          transform="translate(-50%, -50%)"
          width={boxWidth}
          borderWidth="2px"
          borderColor={selectedConnection?.includes(agentId) ? "purple.500" : "gray.200"}
          borderRadius="md"
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={selectedConnection?.includes(agentId) ? "0 0 0 2px rgba(128, 90, 213, 0.4)" : "md"}
          p={3}
          zIndex={2}
          transition="all 0.2s"
          _hover={{
            boxShadow: "lg",
            borderColor: "purple.300"
          }}
        >
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight="bold" color="purple.600" noOfLines={1}>
              观点 {index + 1}
            </Text>
            <Badge colorScheme="purple" fontSize="0.7em">
              智能体 {index + 1}
            </Badge>
          </Flex>
          
          <Text fontSize="sm" fontStyle="italic" mb={2} noOfLines={2}>
            {perspective}
          </Text>
          
          <Divider my={2} />
          
          {debateStatus === 'generating' && !responseText ? (
            <Center py={4}>
              <Spinner size="sm" mr={2} color="purple.500" />
              <Text fontSize="sm">正在思考...</Text>
            </Center>
          ) : (
            <Box
              height="200px"
              overflowY="auto"
              fontSize="sm"
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: responseText ? marked.parse(responseText) : '<em>尚未发言</em>' }}
              sx={{
                'p': { mb: 2 },
                'ul, ol': { pl: 4, mb: 2 },
                'blockquote': {
                  borderLeftWidth: '2px',
                  borderLeftColor: 'purple.200',
                  pl: 3,
                  py: 1,
                  my: 2,
                  fontStyle: 'italic'
                }
              }}
              onClick={() => {
                // 当点击观点框时，弹出详细内容
                if (responseText) {
                  toast({
                    title: `观点 ${index + 1}：${perspective}`,
                    description: (
                      <Box 
                        mt={2} 
                        maxHeight="50vh" 
                        overflowY="auto"
                        dangerouslySetInnerHTML={{ __html: marked.parse(responseText) }}
                        className="markdown-content"
                        sx={{
                          'p': { mb: 2 },
                          'ul, ol': { pl: 4, mb: 2 },
                          'blockquote': {
                            borderLeftWidth: '2px',
                            borderLeftColor: 'purple.200',
                            pl: 3,
                            py: 1,
                            my: 2,
                            fontStyle: 'italic'
                          }
                        }}
                      />
                    ),
                    status: "info",
                    duration: null,
                    isClosable: true,
                    position: "top",
                    size: "xl",
                  });
                }
              }}
            />
          )}
        </Box>
      );
    });
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full" // 改为全屏显示
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader borderBottomWidth="1px">
          <Flex align="center">
            <Icon as={FiGitBranch} mr={2} color={accentColor} />
            <Text>辩证思维助手</Text>
          </Flex>
        </ModalHeader>

        <ModalBody>
          {/* 步骤指示，更专业的步骤名称*/}
          <Flex justify="center" mb={6}>
            <HStack spacing={8}>
              <VStack>
                <Circle
                  size="40px"
                  bg={currentStep === 1 ? "purple.500" : "gray.200"}
                  color={currentStep === 1 ? "white" : "gray.500"}
                >
                  <Text>1</Text>
                </Circle>
                <Text color={currentStep === 1 ? "purple.500" : "gray.500"} fontWeight={currentStep === 1 ? "bold" : "normal"}>
                  视角生成
                </Text>
              </VStack>

              <Box w="60px" h="2px" bg={currentStep > 1 ? "purple.500" : "gray.200"} alignSelf="center" />

              <VStack>
                <Circle
                  size="40px"
                  bg={currentStep === 2 ? "purple.500" : "gray.200"}
                  color={currentStep === 2 ? "white" : "gray.500"}
                >
                  <Text>2</Text>
                </Circle>
                <Text color={currentStep === 2 ? "purple.500" : "gray.500"} fontWeight={currentStep === 2 ? "bold" : "normal"}>
                  思辨分析
                </Text>
              </VStack>

              <Box w="60px" h="2px" bg={currentStep > 2 ? "purple.500" : "gray.200"} alignSelf="center" />

              <VStack>
                <Circle
                  size="40px"
                  bg={currentStep === 3 ? "purple.500" : "gray.200"}
                  color={currentStep === 3 ? "white" : "gray.500"}
                >
                  <Text>3</Text>
                </Circle>
                <Text color={currentStep === 3 ? "purple.500" : "gray.500"} fontWeight={currentStep === 3 ? "bold" : "normal"}>
                  多智能体辩论
                </Text>
              </VStack>
            </HStack>
          </Flex>
          
          {renderStepContent()}
          
          {/* 分析类型选择弹窗 */}
          {isShowingOptions && (
            <Box 
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(0,0,0,0.7)"
              zIndex={1400}
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={() => setIsShowingOptions(false)}
            >
              <Box 
                maxWidth="900px"
                width="90%"
                bg={useColorModeValue('white', 'gray.800')}
                p={6}
                borderRadius="lg"
                boxShadow="xl"
                onClick={(e) => e.stopPropagation()}
                position="relative"
              >
                <IconButton
                  position="absolute"
                  top={2}
                  right={2}
                  aria-label="关闭"
                  icon={<Icon as={FiX} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsShowingOptions(false)}
                />

                <Heading size="md" mb={6} color="purple.600" textAlign="center">
                  选择分析方式
                </Heading>
                
                <Text mb={6} textAlign="center" color="gray.600">
                  您已选择 <Badge colorScheme="purple" fontSize="md">{selectedPerspectives.length}</Badge> 个观点进行分析
                </Text>
                
                <SimpleGrid columns={[1, null, 2]} spacing={6} mb={6}>
                  <Box 
                    p={6} 
                    borderWidth="2px" 
                    borderRadius="lg" 
                    bg={analysisType === 'single' ? 'purple.50' : useColorModeValue('white', 'gray.700')}
                    borderColor={analysisType === 'single' ? 'purple.400' : 'gray.200'}
                    _hover={{ boxShadow: 'md', borderColor: 'purple.300' }}
                    cursor="pointer"
                    onClick={() => setAnalysisType('single')}
                    textAlign="center"
                  >
                    <Flex direction="column" align="center">
                      <Icon as={FiCpu} boxSize={10} color="purple.500" mb={4} />
                      <Heading size="md" mb={3}>单智能体分析</Heading>
                      <Text fontSize="sm" color="gray.600">
                        使用单一智能体对选中观点进行思辨分析，生成综合评价和对比。适合需要全面总结的场景。
                      </Text>
                      
                      {analysisType === 'single' && (
                        <Badge colorScheme="purple" mt={4}>已选择</Badge>
                      )}
                    </Flex>
                  </Box>
                  
                  <Box 
                    p={6} 
                    borderWidth="2px" 
                    borderRadius="lg"
                    bg={analysisType === 'multi' ? 'purple.50' : useColorModeValue('white', 'gray.700')}
                    borderColor={analysisType === 'multi' ? 'purple.400' : 'gray.200'}
                    _hover={{ boxShadow: 'md', borderColor: 'purple.300' }}
                    cursor="pointer" 
                    onClick={() => setAnalysisType('multi')}
                    textAlign="center"
                  >
                    <Flex direction="column" align="center">
                      <Icon as={FiGitBranch} boxSize={10} color="purple.500" mb={4} />
                      <Heading size="md" mb={3}>多智能体辩论</Heading>
                      <Text fontSize="sm" color="gray.600">
                        为每个观点创建智能体，进行多轮辩论，生成深入的思想碰撞。适合探索复杂问题。
                      </Text>
                      
                      {analysisType === 'multi' && (
                        <Badge colorScheme="purple" mt={4}>已选择</Badge>
                      )}
                    </Flex>
                  </Box>
                </SimpleGrid>
                
                <Flex mt={6} justify="center">
                  <Button 
                    colorScheme="purple" 
                    size="lg"
                    isDisabled={!analysisType}
                    onClick={() => {
                      if (analysisType === 'single') {
                        // 进入单智能体分析
                        setCurrentStep(2);
                        generateDialecticalAnalysis();
                      } else if (analysisType === 'multi') {
                        // 初始化多智能体辩论
                        initializeMultiAgentDebate();
                        setCurrentStep(3);
                      }
                      setIsShowingOptions(false);
                    }}
                    leftIcon={analysisType === 'single' ? <Icon as={FiCpu} /> : <Icon as={FiGitBranch} />}
                    minWidth="200px"
                  >
                    开始{analysisType === 'single' ? '分析' : '辩论'}
                  </Button>
                </Flex>
              </Box>
            </Box>
          )}
        </ModalBody>

        <ModalFooter>
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              mr={3} 
              leftIcon={<Icon as={FiArrowLeft} />}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              返回上一步
            </Button>
          )}
          
          {/* 单智能体分析结束后的保存按钮 */}
          {currentStep === 2 && !isGeneratingDebate && analysisResult && (
            <Button 
              colorScheme="purple" 
              leftIcon={<Icon as={FiSave} />}
              onClick={async () => {
                if (onSaveAnalysis) {
                  try {
                    // 保存分析结果到选中的观点相关的节点
                    const analysisData = {
                      type: 'single',
                      topic,
                      perspectives: selectedPerspectives,
                      analysis: analysisResult,
                      timestamp: new Date().toISOString(),
                      style: debateStyle,
                      complexity: complexityLevel,
                      nodes: selectedNodes.map(node => node.id) // 记录相关的节点ID
                    };
                    
                    await onSaveAnalysis(analysisData);
                    
                    toast({
                      title: "分析已保存",
                      description: "思辨分析已成功保存到图谱",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                    
                    onClose();
                  } catch (error) {
                    console.error("保存分析失败:", error);
                    toast({
                      title: "保存失败",
                      description: "无法保存分析结果，请稍后重试",
                      status: "error",
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }
              }}
            >
              保存分析并返回图谱
            </Button>
          )}
          
          {/* 多智能体辩论结束后的保存按钮 */}
          {currentStep === 3 && debateStatus === 'completed' && (
            <Button 
              colorScheme="purple" 
              leftIcon={<Icon as={FiSave} />}
              onClick={async () => {
                if (onSaveAnalysis) {
                  try {
                    // 保存多智能体辩论结果到选中的观点相关的节点
                    const debateData = {
                      type: 'multi',
                      topic,
                      perspectives: selectedPerspectives,
                      rounds: debateRounds,
                      timestamp: new Date().toISOString(),
                      nodes: selectedNodes.map(node => node.id) // 记录相关的节点ID
                    };
                    
                    await onSaveAnalysis(debateData);
                    
                    toast({
                      title: "辩论已保存",
                      description: "多智能体辩论结果已成功保存到图谱",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                    
                    onClose();
                  } catch (error) {
                    console.error("保存辩论失败:", error);
                    toast({
                      title: "保存失败",
                      description: "无法保存辩论结果，请稍后重试",
                      status: "error",
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }
              }}
            >
              保存辩论并返回图谱
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DialogicalThinkingAssistant; 


