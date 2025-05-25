import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useOutsideClick,
  Textarea,
  Button,
  useToast,
  Badge,
  Tooltip,
  Spinner,
  Collapse,
  Icon,
  Divider,
  Tag,
  TagLabel,
  TagLeftIcon,
  Select,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Slider,
  SliderTrack,
  SliderThumb,
  ButtonGroup
} from '@chakra-ui/react';
import { 
  FiMoreHorizontal, 
  FiTrash2, 
  FiEdit2, 
  FiCopy,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiCpu,
  FiSliders,
  FiLink,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiSend,
  FiMessageSquare,
  FiServer,
  FiX
} from 'react-icons/fi';
import { INode, IAINode } from '@types/graph';
import { useAppDispatch, useAppSelector } from '@hooks/reduxHooks';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import { setActiveNode } from '@store/slices/graphsSlice';
import { ChakraMarkdown } from '@components/shared/ChakraMarkdown';
import ReactMarkdown from 'react-markdown';
import aiService, { AIProvider, ModelConfig } from '@api/aiService';
import axios from 'axios';

interface AINodeProps {
  node: INode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
}

const AINode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag
}: AINodeProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  
  // 处理AI节点特有的数据
  const aiNode = node as IAINode;
  const prompt = aiNode.data?.prompt || '';
  const response = aiNode.data?.response || '';
  const model = aiNode.data?.model || 'qwen2.5:7b';
  const temperature = aiNode.data?.temperature || 0.7;
  const contextNodeIds = aiNode.data?.contextNodes || [];
  
  // 状态变量
  const [isEditing, setIsEditing] = useState(false);
  const [isResponseEditing, setIsResponseEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState(prompt);
  const [newResponse, setNewResponse] = useState(response);
  const [newModel, setNewModel] = useState(model);
  const [newTemperature, setNewTemperature] = useState(temperature);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    model.includes('gpt') ? 'openai' : 
    model.includes('claude') ? 'anthropic' : 
    model.includes('llama') || model.includes('mistral') || model.includes('qwen') ? 'ollama' : 'openai'
  );
  const [nodeType, setNodeType] = useState(node.type);
  const [ollamaStatus, setOllamaStatus] = useState<{success: boolean; message: string} | null>(null);
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);
  
  // 节点引用
  const nodeRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLTextAreaElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const aiBgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue(
    isSelected ? 'blue.500' : isActive ? 'blue.300' : 'gray.200',
    isSelected ? 'blue.500' : isActive ? 'blue.300' : 'gray.700'
  );
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.300');
  const promptBgColor = useColorModeValue('gray.50', 'gray.700');
  
  // 获取相关上下文节点
  const nodes = useAppSelector(state => state.nodes.nodes);
  const contextNodes = nodes.filter(n => contextNodeIds.includes(n.id));
  
  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    // 如果已经在编辑，阻止冒泡以免触发选择
    if (isEditing) return;
    
    // 选择节点，如果按住Ctrl/Cmd则多选
    onSelect(node.id, e.ctrlKey || e.metaKey);
    
    // 如果是双击，进入编辑模式
    if (e.detail === 2 && !isEditing) {
      setIsEditing(true);
    }
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    if (onStartDrag && !isEditing) {
      onStartDrag(e, node.id);
    }
  };

  // 处理提示词更新
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPrompt(e.target.value);
  };

  // 处理模型更新
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewModel(e.target.value);
  };

  // 处理温度更新
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewTemperature(parseFloat(e.target.value));
  };

  // 处理提供商变更
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as AIProvider;
    setSelectedProvider(provider);
    
    console.log(`Provider changed to: ${provider}`);
    
    // 更新为所选提供商的默认模型
    const providerModels = availableModels.filter(m => m.provider === provider);
    if (providerModels.length > 0) {
      console.log(`Setting model to ${providerModels[0].id} from available models`);
      setNewModel(providerModels[0].id);
    } else if (provider === 'ollama') {
      // 如果没有找到Ollama模型，设置为默认的qwen2.5:7b
      console.log('No Ollama models found, setting to qwen2.5:7b');
      setNewModel('qwen2.5:7b');
    }
  };

  // 保存更改
  const handleSave = () => {
    if (!newPrompt.trim()) {
      toast({
        title: '提示词不能为空',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    dispatch(updateNode({
      ...node,
      data: {
        ...node.data,
        prompt: newPrompt,
        model: newModel,
        temperature: newTemperature
      },
      updatedAt: new Date().toISOString(),
    }));
    
    setIsEditing(false);
    setIsSettingsOpen(false);
    
    toast({
      title: 'AI节点已更新',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 删除节点
  const handleDelete = () => {
    dispatch(deleteNode(node.id));
    
    toast({
      title: 'AI节点已删除',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // 编辑节点
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 复制生成内容
  const handleCopyResponse = () => {
    navigator.clipboard.writeText(response);
    
    toast({
      title: 'AI回答已复制',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 复制提示词
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    
    toast({
      title: '提示词已复制',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 重新生成
  const handleRegenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: '提示词不能为空',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    // 重新发送到AI
    sendToAI(prompt);
  };

  // 发送新提示词
  const handleSendPrompt = () => {
    if (!newPrompt.trim()) {
      toast({
        title: '提示词不能为空',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    // 保存更新的提示词
    dispatch(updateNode({
      ...node,
      data: {
        ...node.data,
        prompt: newPrompt,
        model: newModel,
        temperature: newTemperature,
        provider: selectedProvider,
      },
    }));
    
    // 发送到AI
    sendToAI(newPrompt);
  };

  // 切换设置面板
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  // 切换提示词显示
  const togglePromptDisplay = () => {
    setShowPrompt(!showPrompt);
  };

  // 处理节点外部点击，保存编辑
  useOutsideClick({
    ref: nodeRef,
    handler: () => {
      if (isEditing) {
        handleSave();
      }
    },
  });

  // 当进入编辑模式时，聚焦文本区域
  useEffect(() => {
    if (isEditing && promptRef.current) {
      promptRef.current.focus();
    }
  }, [isEditing]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果按下Escape键，取消编辑
    if (e.key === 'Escape') {
      setNewPrompt(prompt);
      setNewModel(model);
      setNewTemperature(temperature);
      setIsEditing(false);
      setIsSettingsOpen(false);
    }
  };

  // 加载可用模型
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await aiService.getAvailableModels();
        setAvailableModels(models);
        
        // 检查当前选择的模型是否在可用模型列表中
        if (selectedProvider === 'ollama') {
          const ollamaModels = models.filter(m => m.provider === 'ollama');
          if (ollamaModels.length > 0 && !ollamaModels.some(m => m.id === newModel)) {
            // 如果当前选择的模型不在列表中，设置为第一个可用的Ollama模型
            setNewModel(ollamaModels[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };
    
    loadModels();
  }, [selectedProvider]);

  // 检查Ollama连接状态
  useEffect(() => {
    const checkOllamaConnection = async () => {
      if (selectedProvider === 'ollama') {
        setIsCheckingOllama(true);
        try {
          const status = await aiService.testOllamaConnection();
          setOllamaStatus(status);
          
          if (!status.success) {
            // 更新节点状态以显示错误
            dispatch(updateNode({
              id: node.id,
              data: {
                ...node.data,
                error: status.message
              }
            }));
          } else if (node.data?.error) {
            // 如果之前有错误，现在连接成功了，清除错误
            dispatch(updateNode({
              id: node.id,
              data: {
                ...node.data,
                error: undefined
              }
            }));
          }
        } catch (error) {
          console.error('Error checking Ollama:', error);
          setOllamaStatus({
            success: false,
            message: error instanceof Error ? error.message : '未知错误'
          });
        } finally {
          setIsCheckingOllama(false);
        }
      }
    };
    
    checkOllamaConnection();
  }, [selectedProvider]);

  // 手动检查Ollama连接
  const checkOllamaConnection = async () => {
    setIsCheckingOllama(true);
    try {
      const status = await aiService.testOllamaConnection();
      setOllamaStatus(status);
      
      if (status.success) {
        toast({
          title: "Ollama连接正常",
          description: status.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // 清除之前的错误
        if (node.data?.error) {
          dispatch(updateNode({
            id: node.id,
            data: {
              ...node.data,
              error: undefined
            }
          }));
        }
      } else {
        toast({
          title: "Ollama连接问题",
          description: status.message,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        
        // 更新节点状态以显示错误
        dispatch(updateNode({
          id: node.id,
          data: {
            ...node.data,
            error: status.message
          }
        }));
      }
    } catch (error) {
      console.error('Error checking Ollama connection:', error);
      toast({
        title: "Ollama检查失败",
        description: error instanceof Error ? error.message : '未知错误',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCheckingOllama(false);
    }
  };

  // 添加一个新的组件用于渲染模型选择器
  const AIModelSelector = () => {
    const ollamaModels = availableModels.filter(model => model.provider === 'ollama');
    const openaiModels = availableModels.filter(model => model.provider === 'openai');
    const anthropicModels = availableModels.filter(model => model.provider === 'anthropic');
    const groqModels = availableModels.filter(model => model.provider === 'groq');
    const deepseekModels = availableModels.filter(model => model.provider === 'deepseek');
    const geminiModels = availableModels.filter(model => model.provider === 'gemini');
    const qwenModels = availableModels.filter(model => model.provider === 'qwen');
    const customModels = availableModels.filter(model => model.provider === 'custom');
    
    return (
      <Box mt={3}>
        <FormControl mb={3}>
          <FormLabel fontSize="sm">提供商</FormLabel>
          <Select 
            size="sm" 
            value={selectedProvider}
            onChange={handleProviderChange}
          >
            <option value="openai">OpenAI</option>
            {anthropicModels.length > 0 && <option value="anthropic">Anthropic Claude</option>}
            {groqModels.length > 0 && <option value="groq">Groq</option>}
            {deepseekModels.length > 0 && <option value="deepseek">DeepSeek</option>}
            {geminiModels.length > 0 && <option value="gemini">Google Gemini</option>}
            {qwenModels.length > 0 && <option value="qwen">阿里云通义千问</option>}
            {ollamaModels.length > 0 && <option value="ollama">Ollama (本地)</option>}
            {customModels.length > 0 && <option value="custom">自定义模型</option>}
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel fontSize="sm">模型</FormLabel>
          <Select 
            size="sm" 
            value={newModel}
            onChange={handleModelChange}
          >
            {selectedProvider === 'openai' && openaiModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
            {selectedProvider === 'anthropic' && anthropicModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
            {selectedProvider === 'groq' && groqModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
            {selectedProvider === 'deepseek' && deepseekModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
            {selectedProvider === 'gemini' && geminiModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
            {selectedProvider === 'qwen' && qwenModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
            {selectedProvider === 'ollama' && ollamaModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
            {selectedProvider === 'custom' && customModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  };

  // 在处理发送逻辑的部分添加API调用
  const sendToAI = async (prompt: string) => {
    setIsLoading(true);
    
    try {
      // 如果是Ollama提供商，先检查连接状态
      if (selectedProvider === 'ollama') {
        const status = await aiService.testOllamaConnection();
        if (!status.success) {
          throw new Error(status.message);
        }
      }
      
      // 从上下文节点获取历史消息
      const contextMessages = contextNodes.map(node => ({
        role: 'user' as const,
        content: node.content || ''
      }));
      
      // 构建消息数组
      const messages = [
        { role: 'system' as const, content: '你是一个有用的AI助手，请基于用户的问题提供信息和帮助。' },
        ...contextMessages,
        { role: 'user' as const, content: prompt }
      ];
      
      // 确定提供商和模型
      const provider = selectedProvider;
      
      console.log(`准备发送请求到 ${provider} 模型: ${newModel}`);
      console.log('发送的消息内容:', messages);
      
      let response;
      
      // 对Ollama使用增强的API调用，提高连接成功率
      if (provider === 'ollama') {
        try {
          console.log('使用增强的Ollama API调用...');
          
          // 使用带有重试机制的Ollama调用方法
          response = await aiService.ollamaRequestWithRetry(
            newModel,
            messages,
            newTemperature
          );
          
        } catch (ollamaError) {
          console.error('增强的Ollama API调用失败:', ollamaError);
          
          // 尝试使用aiService作为备选方案
          console.log('尝试通过aiService发送请求...');
          response = await aiService.sendRequest({
            model: newModel,
            messages,
            temperature: newTemperature,
            provider
          });
        }
      } else {
        // 其他提供商使用aiService
        response = await aiService.sendRequest({
          model: newModel,
          messages,
          temperature: newTemperature,
          provider
        });
      }
      
      console.log(`收到来自 ${provider} 的响应:`, response);
      
      if (!response || !response.text) {
        throw new Error('收到空响应或响应格式不正确');
      }
      
      // 更新节点
      dispatch(updateNode({
        id: node.id,
        data: {
          ...node.data,
          prompt,
          response: response.text,
          model: newModel,
          temperature: newTemperature,
          updatedAt: new Date().toISOString(),
          error: undefined // 清除之前的错误
        },
      }));
      
      toast({
        title: 'AI回答已生成',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('获取AI响应失败:', error);
      
      // 提供更详细的错误信息
      let errorMessage = '未知错误';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      // 针对Ollama的特定错误处理
      if (selectedProvider === 'ollama') {
        if (errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Failed to fetch')) {
          errorMessage = 'Ollama服务连接失败。请确保Ollama正在运行，并且可以通过http://localhost:11434访问。命令行运行 "ollama serve" 启动服务。';
        } else if (errorMessage.includes('not found') || errorMessage.includes('no model loaded')) {
          errorMessage = `模型 "${newModel}" 未找到或未加载。请确保已下载该模型，可以通过运行 "ollama pull ${newModel}" 来下载。`;
        } else if (errorMessage.includes('context length')) {
          errorMessage = '输入内容过长，超过了模型的上下文长度限制';
        }
      }
      
      toast({
        title: 'AI回答生成失败',
        description: `错误: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // 更新节点以显示错误
      dispatch(updateNode({
        id: node.id,
        data: {
          ...node.data,
          error: errorMessage
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 从节点类型获取预设提示词
  const getTemplatePromptForNodeType = (nodeType: string, content: string = ''): string => {
    switch(nodeType) {
      case 'text':
        return `生成一段关于${content || '此主题'}的说明文字，包含关键概念和见解。`;
      case 'question':
        return `提出关于${content || '此主题'}的5个重要问题，这些问题能启发深入思考。`;
      case 'answer':
        return `请详细回答这个问题: ${content || '[问题]'}`;
      case 'debate':
        return `请提供关于"${content || '此主题'}"的多种不同观点，并分析各个观点的优缺点。`;
      case 'port':
        return `请为"${content || '此主题'}"创建一个模块化解释，包含输入、过程和输出。`;
      default:
        return prompt || '请提供分析和见解。';
    }
  };
  
  // 处理节点类型变更
  const handleNodeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setNodeType(newType);
    
    // 如果类型变更为非AI类型，将当前节点转换为相应类型
    if (newType !== 'ai') {
      let updateData: any = {};
      
      if (newType === 'text') {
        updateData = {
          content: response || prompt,
          format: 'plain',
        };
      } else if (newType === 'question') {
        updateData = {
          content: prompt,
          format: 'plain',
          answerNodeIds: [],
        };
      } else if (newType === 'debate') {
        updateData = {
          topic: prompt,
          perspectives: [],
          analysis: response,
        };
      }
      
      dispatch(updateNode({
        id: node.id,
        type: newType as any,
        data: updateData,
      }));
    }
  };

  // 根据节点类型生成提示词
  const generatePromptFromType = () => {
    const template = getTemplatePromptForNodeType(nodeType);
    setNewPrompt(template);
    toast({
      title: '已生成提示词模板',
      description: `基于${nodeType}类型生成了提示词模板`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box
      ref={nodeRef}
      position="absolute"
      left={`${node.position?.x || 0}px`}
      top={`${node.position?.y || 0}px`}
      minWidth="300px"
      maxWidth="400px"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow={isSelected ? 'md' : 'sm'}
      transition="all 0.2s"
      _hover={{ borderColor: hoverBorderColor }}
      zIndex={isActive || isSelected ? 10 : 1}
      onMouseDown={handleClick}
      onClick={(e) => e.stopPropagation()}
      onMouseDownCapture={handleDragStart}
      onKeyDown={handleKeyDown}
    >
      {/* 节点标题栏 */}
      <Flex
        px={3}
        py={1}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        justifyContent="space-between"
        alignItems="center"
        bg={aiBgColor}
        borderTopRadius="md"
        cursor="grab"
      >
        <Flex alignItems="center">
          <Icon as={FiCpu} color="blue.600" boxSize={3} />
          <HStack ml={2} spacing={2}>
            <Text fontSize="xs" fontWeight="medium">AI节点</Text>
            
            {/* 节点类型选择器 */}
            <Select
              size="xs"
              value={nodeType}
              onChange={handleNodeTypeChange}
              width="100px"
              variant="filled"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="ai">AI</option>
              <option value="text">文本</option>
              <option value="question">问题</option>
              <option value="answer">回答</option>
              <option value="debate">辩论</option>
              <option value="port">模块</option>
            </Select>
          </HStack>
        </Flex>

        <Flex>
          {/* 显示当前使用的模型和提供商 */}
          <Tooltip label={`${newModel} (${selectedProvider === 'ollama' ? '本地' : selectedProvider})`}>
            <Tag size="sm" colorScheme={selectedProvider === 'ollama' ? 'green' : 'blue'} mr={1}>
              <TagLeftIcon as={selectedProvider === 'ollama' ? FiCpu : FiCloud} boxSize="10px" />
              <TagLabel fontSize="10px">{newModel.length > 10 ? newModel.substring(0, 10) + '...' : newModel}</TagLabel>
            </Tag>
          </Tooltip>
          
          <IconButton
            aria-label="设置"
            icon={<FiSliders />}
            size="xs"
            variant="ghost"
            onClick={toggleSettings}
          />
          <Menu isLazy placement="bottom-end">
            <MenuButton
              as={IconButton}
              aria-label="更多选项"
              icon={<FiMoreHorizontal />}
              size="xs"
              variant="ghost"
            />
            <MenuList fontSize="sm">
              <MenuItem icon={<FiEdit2 />} onClick={() => setIsEditing(true)}>
                编辑提示词
              </MenuItem>
              <MenuItem icon={<FiCopy />} onClick={handleCopyResponse}>
                复制回答
              </MenuItem>
              <MenuItem icon={<FiRefreshCw />} onClick={handleRegenerate} isDisabled={isLoading}>
                重新生成
              </MenuItem>
              <MenuItem icon={<FiZap />} onClick={generatePromptFromType}>
                生成提示词模板
              </MenuItem>
              <MenuItem icon={<FiTrash2 />} onClick={handleDelete} color="red.400">
                删除
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Ollama连接状态指示器 */}
      {selectedProvider === 'ollama' && (
        <Box 
          px={3} 
          py={1} 
          bg={useColorModeValue('gray.50', 'gray.800')}
          borderBottomWidth="1px" 
          borderBottomColor={borderColor}
        >
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <Icon 
                as={FiServer} 
                color={isLoading || isCheckingOllama ? "orange.400" : 
                      ollamaStatus?.success ? "green.400" : 
                      aiNode.data?.error ? "red.400" : "yellow.400"} 
                boxSize={3} 
                mr={1} 
              />
              <Text fontSize="xs">
                {isLoading ? "正在连接Ollama..." : 
                 isCheckingOllama ? "正在检查Ollama连接..." :
                 ollamaStatus?.success ? "Ollama已连接" : 
                 aiNode.data?.error ? "Ollama连接失败" : 
                 "Ollama状态未知"}
              </Text>
            </Flex>
            <Tooltip label="检查Ollama连接状态">
              <IconButton
                aria-label="检查连接"
                icon={<FiRefreshCw />}
                size="xs"
                variant="ghost"
                isLoading={isCheckingOllama}
                onClick={checkOllamaConnection}
              />
            </Tooltip>
          </Flex>
        </Box>
      )}

      {/* 提示词和设置区域 */}
      <Collapse in={showPrompt}>
        <Box px={3} py={2} bg={promptBgColor} position="relative">
          {isEditing ? (
            <Box position="relative">
              <Textarea
                ref={promptRef}
                value={newPrompt}
                onChange={handlePromptChange}
                placeholder="输入提示词..."
                size="sm"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setNewPrompt(prompt);
                  } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSave();
                  }
                }}
                mb={2}
                border="2px solid"
                borderColor="blue.400"
                boxShadow="sm"
                _focus={{
                  boxShadow: "outline",
                }}
              />
              <ButtonGroup size="xs" position="absolute" bottom="10px" right="5px">
                <Button
                  colorScheme="gray"
                  onClick={() => {
                    setIsEditing(false);
                    setNewPrompt(prompt);
                  }}
                >
                  取消
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleSave}
                >
                  保存
                </Button>
              </ButtonGroup>
            </Box>
          ) : (
            <Box 
              onClick={() => setIsEditing(true)}
              cursor="text"
              fontSize="sm"
              p={2}
              borderRadius="md"
              borderWidth="1px"
              borderColor="transparent"
              minHeight="80px"
              _hover={{ 
                bg: useColorModeValue('gray.100', 'gray.700'),
                borderColor: 'gray.300'
              }}
              transition="all 0.2s"
            >
              <Text whiteSpace="pre-wrap">{prompt || "点击此处输入提示词..."}</Text>
            </Box>
          )}

          <Flex justifyContent="space-between" alignItems="center" mt={1}>
            <Text fontSize="xs" color="gray.500">
              {isEditing ? '按Ctrl+Enter保存, Esc取消' : '点击文本区域编辑提示词'}
            </Text>
            {!isEditing && (
              <Button
                size="xs"
                leftIcon={<FiSend />}
                colorScheme="blue"
                onClick={handleSendPrompt}
                isLoading={isLoading}
                loadingText="生成中"
              >
                发送
              </Button>
            )}
          </Flex>
        </Box>
      </Collapse>

      {/* 模型设置区域 */}
      <Collapse in={isSettingsOpen}>
        <Box px={3} py={2} bg={useColorModeValue('gray.50', 'gray.700')}>
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Text fontSize="xs" fontWeight="bold">模型设置</Text>
            <IconButton
              aria-label="关闭设置"
              icon={<FiX />}
              size="xs"
              variant="ghost"
              onClick={toggleSettings}
            />
          </Flex>
          
          <AIModelSelector />
          
          <FormControl size="sm" mt={3}>
            <FormLabel fontSize="xs">温度值 ({newTemperature})</FormLabel>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={newTemperature}
              onChange={(val) => setNewTemperature(val)}
              colorScheme="blue"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
            <Flex justify="space-between" fontSize="xs" color="gray.500" mt={1}>
              <Text>精确</Text>
              <Text>平衡</Text>
              <Text>创造性</Text>
            </Flex>
          </FormControl>
          
          <Flex justifyContent="flex-end" mt={3}>
            <Button size="xs" colorScheme="blue" onClick={toggleSettings}>
              完成
            </Button>
          </Flex>
        </Box>
      </Collapse>

      {/* AI回答部分 */}
      <Box p={3} position="relative">
        {isResponseEditing ? (
          <Box position="relative">
            <Textarea
              ref={responseRef}
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="编辑AI回答..."
              size="sm"
              rows={8}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsResponseEditing(false);
                  setNewResponse(response);
                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  dispatch(updateNode({
                    id: node.id,
                    data: {
                      ...node.data,
                      response: newResponse,
                    },
                  }));
                  setIsResponseEditing(false);
                }
              }}
              mb={2}
              border="2px solid"
              borderColor="blue.400"
              boxShadow="sm"
              _focus={{
                boxShadow: "outline",
              }}
            />
            <ButtonGroup size="xs" position="absolute" bottom="10px" right="5px">
              <Button
                colorScheme="gray"
                onClick={() => {
                  setIsResponseEditing(false);
                  setNewResponse(response);
                }}
              >
                取消
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => {
                  dispatch(updateNode({
                    id: node.id,
                    data: {
                      ...node.data,
                      response: newResponse,
                    },
                  }));
                  setIsResponseEditing(false);
                }}
              >
                保存
              </Button>
            </ButtonGroup>
          </Box>
        ) : (
          <Box 
            onClick={() => {
              if (response && !isLoading) setIsResponseEditing(true);
            }}
            cursor={response && !isLoading ? "text" : "default"}
            position="relative"
            borderWidth="1px"
            borderColor="transparent"
            borderRadius="md"
            p={2}
            minHeight="100px"
            _hover={response && !isLoading ? { 
              bg: useColorModeValue('gray.50', 'gray.800'),
              borderColor: 'gray.300'
            } : {}}
            transition="all 0.2s"
          >
            {isLoading ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Spinner size="lg" color="blue.500" mb={4} />
                <Text>AI思考中...</Text>
                {selectedProvider === 'ollama' && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    正在使用本地Ollama处理，首次响应可能较慢
                  </Text>
                )}
              </Flex>
            ) : aiNode.data?.error ? (
              <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={4}>
                <AlertIcon boxSize="6" mr={0} />
                <AlertTitle mt={2} mb={1} fontSize="md">连接错误</AlertTitle>
                <AlertDescription maxWidth="sm" fontSize="sm">
                  {aiNode.data.error}
                </AlertDescription>
                <Button 
                  mt={3} 
                  size="sm" 
                  leftIcon={<FiRefreshCw />}
                  onClick={handleRegenerate}
                >
                  重试
                </Button>
              </Alert>
            ) : response ? (
              <Box>
                <ReactMarkdown className="markdown-body">{response}</ReactMarkdown>
                {selectedProvider === 'ollama' && (
                  <Badge colorScheme="green" mt={2} variant="subtle">
                    由本地Ollama生成 · {newModel}
                  </Badge>
                )}
              </Box>
            ) : (
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={8}
                color="gray.500"
              >
                <Icon as={FiMessageSquare} fontSize="2xl" mb={2} />
                <Text>点击"发送"发起AI分析</Text>
                <Text fontSize="sm" mt={1}>
                  {selectedProvider === 'ollama' ? (
                    <Badge colorScheme="green" variant="subtle">
                      使用本地Ollama: {newModel}
                    </Badge>
                  ) : (
                    <Badge colorScheme="blue" variant="subtle">
                      使用{selectedProvider}: {newModel}
                    </Badge>
                  )}
                </Text>
              </Flex>
            )}
          </Box>
        )}
        
        {/* 底部工具栏 */}
        {response && !isResponseEditing && !aiNode.data?.error && (
          <Flex justifyContent="space-between" mt={3}>
            <Text fontSize="xs" color="gray.500">
              {new Date(aiNode.data?.updatedAt || '').toLocaleString()}
            </Text>
            <HStack>
              <Tooltip label="编辑回答">
                <IconButton
                  aria-label="编辑回答"
                  icon={<FiEdit2 />}
                  size="xs"
                  variant="ghost"
                  onClick={() => setIsResponseEditing(true)}
                />
              </Tooltip>
              <Tooltip label="复制回答">
                <IconButton
                  aria-label="复制回答"
                  icon={<FiCopy />}
                  size="xs"
                  variant="ghost"
                  onClick={handleCopyResponse}
                />
              </Tooltip>
              <Tooltip label="重新生成">
                <IconButton
                  aria-label="重新生成"
                  icon={<FiRefreshCw />}
                  size="xs"
                  variant="ghost"
                  onClick={handleRegenerate}
                  isDisabled={isLoading}
                />
              </Tooltip>
            </HStack>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default AINode; 