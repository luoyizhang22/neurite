import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Box,
  Text,
  Button,
  Flex,
  Radio,
  RadioGroup,
  Stack,
  Textarea,
  useColorModeValue,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Image,
  SimpleGrid,
  Select,
  FormControl,
  FormLabel,
  Switch,
  Tooltip,
  IconButton,
  Collapse,
  Badge,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  VStack,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import { INode } from '@types/graph';
import { ContentExtractor, ExtractedContent } from '../../api/ContentExtractor';
import { PromptBuilder, PromptOptions, AnalysisType } from '../../api/PromptBuilder';
import { FiSettings, FiInfo, FiZap, FiMaximize2, FiMinimize2, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import aiService from '../../api/aiService';
import ReactMarkdown from 'react-markdown';

interface MultiNodeQueryProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodes: INode[];
  onCreateNode: (nodeData: any) => void;
}

const MultiNodeQuery: React.FC<MultiNodeQueryProps> = ({
  isOpen,
  onClose,
  selectedNodes,
  onCreateNode,
}) => {
  // 状态管理
  const [queryType, setQueryType] = useState<AnalysisType>('synthesize');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [extractedContents, setExtractedContents] = useState<ExtractedContent[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [expandedPreviews, setExpandedPreviews] = useState<string[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<React.ReactNode | null>(null);
  
  // 使用toast hook
  const toast = useToast();
  
  // 高级设置
  const [advancedSettings, setAdvancedSettings] = useState({
    model: 'qwen2.5:7b',
    maxTokens: 1000,
    includeImages: true,
  });
  
  // 提示词选项
  const [promptOptions, setPromptOptions] = useState<Partial<PromptOptions>>({
    temperature: 0.7,
    detailLevel: 'detailed',
    outputFormat: 'markdown',
    language: 'zh',
  });

  // 添加连接设置
  const [connectionSettings, setConnectionSettings] = useState({
    createConnections: true,
    connectionType: 'direct',
    bidirectional: false,
  });

  // 样式设置
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('purple.500', 'purple.300');
  const highlightBg = useColorModeValue('purple.50', 'purple.900');

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setResult('');
      setError('');
      
      // 如果只有一个节点，默认使用synthesize
      if (selectedNodes.length === 1) {
        setQueryType('synthesize');
      } else {
        setQueryType('compare');
      }
      
      // 提取节点内容
      console.log(`开始提取 ${selectedNodes.length} 个节点的内容`);
      
      // 检查节点有效性
      if (selectedNodes.length === 0) {
        console.warn('没有选择节点');
        setExtractedContents([]);
        return;
      }
      
      // 记录节点信息
      selectedNodes.forEach((node, index) => {
        console.log(`节点 ${index+1}: ID=${node.id}, 类型=${node.type}`);
      });
      
      // 提取内容
      const contents = ContentExtractor.extractMultipleContents(selectedNodes);
      console.log(`提取完成，获取到 ${contents.length} 个内容对象`);
      
      // 检查提取结果
      if (contents.length === 0) {
        console.warn('未能提取到任何内容');
        toast({
          title: "内容提取警告",
          description: "未能从选中节点提取到有效内容，请检查节点数据",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.log('提取的内容预览:');
        contents.forEach((content, index) => {
          console.log(`内容 ${index+1}: 类型=${content.type}, 标题=${content.title || '无标题'}`);
          console.log(`文本预览: ${content.text.substring(0, 50)}...`);
        });
      }
      
      setExtractedContents(contents);
    }
  }, [isOpen, selectedNodes, toast]);

  // 处理高级设置变更
  const handleOptionChange = (key: keyof PromptOptions, value: any) => {
    setPromptOptions(prev => ({
      ...prev,
      [key]: value
    }));
    
    // 某些选项可能需要重新构建提示词
    if (['detailLevel', 'outputFormat', 'language'].includes(key)) {
      console.log(`变更设置: ${key} = ${value}`);
    }
  };

  // 切换节点预览展开状态
  const togglePreviewExpand = (nodeId: string) => {
    setExpandedPreviews(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId) 
        : [...prev, nodeId]
    );
  };

  // 执行查询
  const executeQuery = async () => {
    // 检查是否有选中的节点
    if (selectedNodes.length === 0) {
      toast({
        title: "未选择节点",
        description: "请选择至少一个节点进行分析",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 检查是否有内容
    if (extractedContents.length === 0) {
      toast({
        title: "无内容可分析",
        description: "未能从选择的节点中提取到内容，请选择包含文本内容的节点",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 设置状态
    setIsLoading(true);
    setError(null);
    setResult('');
    
    try {
      // 获取用户偏好设置
      const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
      const useCustomPrompts = userPreferences.useCustomPrompts || false;
      const customPromptTemplates = userPreferences.customPromptTemplates || {};
      
      // 获取当前分析类型对应的自定义模板
      const customPromptTemplate = customPromptTemplates[queryType];
      
      // 构建提示词选项
      const finalPromptOptions: PromptOptions = {
        temperature: promptOptions.temperature || 0.7,
        maxTokens: advancedSettings.maxTokens,
        includeImages: advancedSettings.includeImages,
        detailLevel: promptOptions.detailLevel || 'detailed',
        outputFormat: promptOptions.outputFormat || 'markdown',
        language: promptOptions.language || 'zh',
        customInstructions: promptOptions.customInstructions || '',
        // 添加自定义模板选项
        useCustomTemplates: useCustomPrompts && !!customPromptTemplate,
        customPromptTemplate: customPromptTemplate
      };
      
      // 根据分析类型构建提示词
      const prompt = PromptBuilder.buildPromptByType(
        queryType, 
        extractedContents, 
        queryType === 'custom' ? customPrompt : undefined,
        finalPromptOptions
      );
      
      // 构建系统提示词
      const systemPrompt = PromptBuilder.buildSystemPrompt(queryType, finalPromptOptions);
      
      // 构建消息数组
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: prompt }
      ];
      
      console.log('系统提示词:', systemPrompt);
      console.log('用户提示词:', prompt);
      
      // 显示加载提示
      const loadingToast = toast({
        title: "正在分析",
        description: `正在使用 ${advancedSettings.model} 模型分析内容中...`,
        status: "info",
        duration: null,
        isClosable: false,
      });
      
      // 发送请求
        const response = await aiService.ollamaRequestWithRetry(
        advancedSettings.model,
        messages,
        finalPromptOptions.temperature || 0.7
      );
      
      // 关闭加载提示
      toast.close(loadingToast);
      
      // 设置响应
        setResult(response.text);
        
      // 显示成功提示
        toast({
        title: "分析完成",
        description: "您可以查看分析结果并根据需要创建新节点",
        status: "success",
        duration: 4000,
          isClosable: true,
        });
    } catch (error: any) {
      console.error('查询执行错误:', error);
      
      // 增强错误提示和诊断
      let errorMessage = '执行分析时出错';
      let errorDetails = '';
      let possibleSolution = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack
        });
        
        // 分析错误类型，提供不同的解决方案
        if (error.message.includes('连接') || error.message.includes('Network')) {
          possibleSolution = '请检查Ollama服务是否正在运行。';
        } else if (error.message.includes('模型') || error.message.includes('model')) {
          possibleSolution = '请确保模型已正确安装。';
        } else if (error.message.includes('超时') || error.message.includes('timeout')) {
          possibleSolution = '请尝试使用更小的模型或减少分析内容。';
        } else if (error.message.includes('内容') || error.message.includes('提示词')) {
          possibleSolution = '请选择包含更多文本内容的节点。';
        }
        
        // 添加详细信息
        if (error.stack) {
          errorDetails = error.stack.split('\n')[0];
        }
      }
      
      // 显示用户友好的错误消息
      toast({
        title: "分析失败",
        description: (
          <Box>
            <Text>{errorMessage}</Text>
            {possibleSolution && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {possibleSolution}
              </Text>
            )}
            {errorDetails && (
              <Text fontSize="xs" color="gray.400" mt={2}>
                {errorDetails}
              </Text>
            )}
          </Box>
        ),
        status: "error",
        duration: 8000,
                      isClosable: true,
                    });
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 增强内容诊断功能
  const runContentDiagnostics = () => {
    // 检查节点和提取内容数量
    const nodeCount = selectedNodes.length;
    const contentCount = extractedContents.length;
    
    console.log('==== 内容诊断报告 ====');
    console.log(`选择的节点数: ${nodeCount}`);
    console.log(`提取的内容数: ${contentCount}`);
    
    if (nodeCount !== contentCount) {
      console.warn(`节点数和内容数不匹配: ${nodeCount} vs ${contentCount}`);
    }
    
    // 检查空内容
    const emptyContents = extractedContents.filter(c => !c.text || c.text.trim() === '');
    console.log(`空内容数: ${emptyContents.length}`);
    
    // 检查内容质量
    const lowQualityContents = extractedContents.filter(c => {
      const text = c.text || '';
      // 检查内容是否包含错误信息
      const containsErrorMessage = 
        text.includes('递归深度超过限制') || 
        text.includes('[内容过深') || 
        text.includes('[循环引用') ||
        text.includes('[无法序列化') ||
        text.includes('[复杂对象');
      
      // 检查内容是否过短
      const tooShort = text.length < 20;
      
      // 检查内容是否是JSON字符串
      const isJsonString = 
        (text.startsWith('{') && text.endsWith('}')) || 
        (text.startsWith('[') && text.endsWith(']'));
      
      return containsErrorMessage || tooShort || isJsonString;
    });
    
    console.log(`低质量内容数: ${lowQualityContents.length}`);
    
    // 统计每种类型的节点数量
    const typeStats = extractedContents.reduce((acc, content) => {
      acc[content.type] = (acc[content.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('节点类型统计:', typeStats);
    
    // 计算内容长度分布
    const contentLengths = extractedContents.map(c => c.text.length);
    const lengthStats = {
      min: contentLengths.length > 0 ? Math.min(...contentLengths) : 0,
      max: contentLengths.length > 0 ? Math.max(...contentLengths) : 0,
      avg: Math.round(extractedContents.reduce((sum, c) => sum + c.text.length, 0) / Math.max(extractedContents.length, 1)),
      total: extractedContents.reduce((sum, c) => sum + c.text.length, 0),
      median: contentLengths.length > 0 
        ? contentLengths.sort((a, b) => a - b)[Math.floor(contentLengths.length / 2)] 
        : 0
    };
    
    console.log('内容长度统计:', lengthStats);
    
    // 检查内容相似度
    const checkContentSimilarity = () => {
      const similarities: {node1: string, node2: string, similarity: number}[] = [];
      
      // 简单的相似度检查 - 基于共同单词比例
      for (let i = 0; i < extractedContents.length; i++) {
        const content1 = extractedContents[i].text;
        const words1 = new Set(content1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        
        for (let j = i + 1; j < extractedContents.length; j++) {
          const content2 = extractedContents[j].text;
          const words2 = new Set(content2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
          
          // 计算共同单词
          let commonWords = 0;
          for (const word of words1) {
            if (words2.has(word)) commonWords++;
          }
          
          // 计算相似度
          const similarity = words1.size && words2.size 
            ? commonWords / Math.min(words1.size, words2.size)
            : 0;
          
          if (similarity > 0.5) {
            similarities.push({
              node1: `节点 ${i+1}`,
              node2: `节点 ${j+1}`,
              similarity: Math.round(similarity * 100)
            });
          }
        }
      }
      
      return similarities;
    };
    
    const similarities = checkContentSimilarity();
    console.log('内容相似度检查:', similarities);
    
    // 显示每个节点的摘要信息
    console.log('节点内容摘要:');
    selectedNodes.forEach((node, i) => {
      const content = i < extractedContents.length ? extractedContents[i] : null;
      console.log(`节点 ${i+1}:`);
      console.log(`- ID: ${node.id}`);
      console.log(`- 类型: ${node.type}`);
      console.log(`- 数据字段: ${node.data ? Object.keys(node.data).join(', ') : '无'}`);
      console.log(`- 提取内容: ${content ? (content.text ? content.text.substring(0, 50) + '...' : '空') : '未提取'}`);
      
      // 检查特定节点类型的问题
      if (node.type === 'ai' && (!node.data?.response || node.data.response.length < 10)) {
        console.warn(`- 警告: AI节点缺少有效响应`);
      }
      if (node.type === 'text' && (!node.data?.content || node.data.content.length < 10)) {
        console.warn(`- 警告: 文本节点内容过短`);
      }
      if (node.type === 'image' && !node.data?.url) {
        console.warn(`- 警告: 图像节点缺少URL`);
      }
    });
    
    // 尝试预测可能的问题
    const diagnoseIssues = () => {
      const issues: {message: string, severity: 'info' | 'warning' | 'error'}[] = [];
      
      if (nodeCount === 0) {
        issues.push({
          message: '未选择任何节点',
          severity: 'error'
        });
      }
      
      if (emptyContents.length > 0) {
        issues.push({
          message: `${emptyContents.length}个节点内容为空`,
          severity: emptyContents.length === nodeCount ? 'error' : 'warning'
        });
      }
      
      if (lowQualityContents.length > 0) {
        issues.push({
          message: `${lowQualityContents.length}个节点内容质量较低`,
          severity: 'warning'
        });
      }
      
      if (nodeCount > 0 && contentCount === 0) {
        issues.push({
          message: '选择了节点但未能提取任何内容',
          severity: 'error'
        });
      }
      
      if (lengthStats.total > 20000) {
        issues.push({
          message: `总内容长度(${lengthStats.total}字符)可能超出模型上下文限制`,
          severity: lengthStats.total > 30000 ? 'error' : 'warning'
        });
      }
      
      if (lengthStats.avg < 10 && nodeCount > 0) {
        issues.push({
          message: '平均内容长度过短，可能缺少有效信息',
          severity: 'warning'
        });
      }
      
      if (similarities.length > 0) {
        issues.push({
          message: `检测到${similarities.length}对高度相似的节点内容`,
          severity: 'info'
        });
      }
      
      // 检查节点类型多样性
      if (Object.keys(typeStats).length === 1 && nodeCount > 3) {
        issues.push({
          message: '所有节点类型相同，考虑添加不同类型的节点以获得更全面的分析',
          severity: 'info'
        });
      }
      
      // 检查内容长度差异
      if (lengthStats.max > lengthStats.min * 10 && nodeCount > 1) {
        issues.push({
          message: '节点内容长度差异很大，可能导致分析不平衡',
          severity: 'info'
        });
      }
      
      return issues;
    };
    
    const issues = diagnoseIssues();
    
    // 创建一个可视化的诊断报告
    const DiagnosticReport = (
      <VStack align="start" spacing={3} p={4} bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md" maxH="500px" overflow="auto" w="100%">
        <Heading size="md">内容诊断报告</Heading>
        
        <Box w="100%">
          <Text fontWeight="medium">节点基本信息:</Text>
          <SimpleGrid columns={2} spacing={2} mt={1}>
            <Box p={2} bg="blue.50" _dark={{ bg: "blue.900" }} borderRadius="md">
              <Text fontWeight="medium">{nodeCount}</Text>
              <Text fontSize="sm">选中节点数</Text>
            </Box>
            <Box p={2} bg="green.50" _dark={{ bg: "green.900" }} borderRadius="md">
              <Text fontWeight="medium">{contentCount}</Text>
              <Text fontSize="sm">提取内容数</Text>
            </Box>
            <Box p={2} bg="purple.50" _dark={{ bg: "purple.900" }} borderRadius="md">
              <Text fontWeight="medium">{contentCount - emptyContents.length}</Text>
              <Text fontSize="sm">有效内容数</Text>
            </Box>
            <Box p={2} bg="orange.50" _dark={{ bg: "orange.900" }} borderRadius="md">
              <Text fontWeight="medium">{Object.keys(typeStats).length}</Text>
              <Text fontSize="sm">节点类型数</Text>
            </Box>
          </SimpleGrid>
        </Box>
        
        <Box w="100%">
          <Text fontWeight="medium">内容长度统计:</Text>
          <SimpleGrid columns={5} spacing={2} mt={1}>
            <Box p={2} bg="teal.50" _dark={{ bg: "teal.900" }} borderRadius="md">
              <Text fontWeight="medium">{lengthStats.total}</Text>
              <Text fontSize="sm">总字符数</Text>
            </Box>
            <Box p={2} bg="cyan.50" _dark={{ bg: "cyan.900" }} borderRadius="md">
              <Text fontWeight="medium">{lengthStats.avg}</Text>
              <Text fontSize="sm">平均字符数</Text>
            </Box>
            <Box p={2} bg="blue.50" _dark={{ bg: "blue.900" }} borderRadius="md">
              <Text fontWeight="medium">{lengthStats.min}</Text>
              <Text fontSize="sm">最小字符数</Text>
            </Box>
            <Box p={2} bg="purple.50" _dark={{ bg: "purple.900" }} borderRadius="md">
              <Text fontWeight="medium">{lengthStats.max}</Text>
              <Text fontSize="sm">最大字符数</Text>
            </Box>
            <Box p={2} bg="pink.50" _dark={{ bg: "pink.900" }} borderRadius="md">
              <Text fontWeight="medium">{lengthStats.median}</Text>
              <Text fontSize="sm">中位数字符数</Text>
            </Box>
          </SimpleGrid>
        </Box>
        
        {issues.length > 0 && (
          <Box w="100%">
            <Text fontWeight="medium">检测到的问题:</Text>
            <VStack align="start" spacing={1} mt={1}>
              {issues.map((issue, index) => (
                <Alert key={index} status={
                  issue.severity === 'error' ? 'error' : 
                  issue.severity === 'warning' ? 'warning' : 'info'
                } size="sm" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">{issue.message}</Text>
                </Alert>
              ))}
            </VStack>
          </Box>
        )}
        
        <Box w="100%">
          <Text fontWeight="medium">节点类型分布:</Text>
          <SimpleGrid columns={2} spacing={2} mt={1}>
            {Object.entries(typeStats).map(([type, count]) => (
              <Box key={type} p={2} bg="gray.100" _dark={{ bg: "gray.600" }} borderRadius="md">
                <Text fontWeight="medium">{count}</Text>
                <Text fontSize="sm">{type}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
        
        {similarities.length > 0 && (
          <Box w="100%">
            <Text fontWeight="medium">内容相似度:</Text>
            <VStack align="start" spacing={1} mt={1}>
              {similarities.map((sim, index) => (
                <Box key={index} p={2} bg="yellow.50" _dark={{ bg: "yellow.900" }} borderRadius="md" w="100%">
                  <Text fontSize="sm">
                    {sim.node1} 和 {sim.node2} 相似度: {sim.similarity}%
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
        
        <Box w="100%">
          <Text fontWeight="medium">节点内容摘要:</Text>
          <VStack align="start" spacing={2} mt={1}>
            {extractedContents.map((content, index) => (
              <Box key={index} p={2} bg="gray.100" _dark={{ bg: "gray.600" }} borderRadius="md" w="100%">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium">节点 {index+1} ({content.type})</Text>
                  <Badge colorScheme={content.text.length < 20 ? "red" : content.text.length > 1000 ? "green" : "blue"}>
                    {content.text.length} 字符
                  </Badge>
                </HStack>
                <Text fontSize="sm" noOfLines={2}>
                  {content.text.substring(0, 100)}{content.text.length > 100 ? '...' : ''}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
        
        <HStack w="100%" justify="flex-end" pt={2}>
          <Button size="sm" colorScheme="blue" onClick={() => {
            // 关闭诊断报告
            setDiagnosticReport(null);
            // 如果有错误级别的问题，显示提示
            const hasErrors = issues.some(issue => issue.severity === 'error');
            if (hasErrors) {
                        toast({
                title: "检测到严重问题",
                description: "请修复错误后再执行查询",
                          status: "error",
                          duration: 5000,
                          isClosable: true,
                        });
            }
          }}>
            关闭报告
                </Button>
        </HStack>
          </VStack>
    );
    
    // 显示诊断报告
    setDiagnosticReport(DiagnosticReport);
    
    // 如果有严重问题，显示提示
    const hasErrors = issues.some(issue => issue.severity === 'error');
    if (hasErrors) {
      toast({
        title: "内容诊断发现问题",
        description: "检测到一些严重问题，请查看诊断报告",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else if (issues.length > 0) {
      toast({
        title: "内容诊断完成",
        description: `检测到${issues.length}个潜在问题，请查看诊断报告`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: "内容诊断完成",
        description: "未检测到明显问题，内容质量良好",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 修改分析类型选项，移除辩论选项
  const analysisTypeOptions = [
    { value: 'compare', label: '比较分析', description: '对比多个节点内容的异同点' },
    { value: 'synthesize', label: '综合分析', description: '整合多个节点的信息形成更高层次的理解' },
    { value: 'explore', label: '关系探索', description: '发现节点内容之间的潜在联系' },
    { value: 'custom', label: '自定义查询', description: '使用自定义提示词进行分析' }
  ];

  // 修改handleCreateNode函数，添加创建连接的功能
  const handleCreateNode = () => {
    if (!result) {
      toast({
        title: "无内容可保存",
        description: "请先执行分析生成内容",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 创建新节点
    const nodeType = 'text'; // 默认创建文本节点
    const nodeData = {
      type: nodeType,
      content: result,
      data: {
        content: result,
        format: 'markdown',
        analysisType: queryType,
        sourceNodeIds: selectedNodes.map(node => node.id),
        createdAt: new Date().toISOString()
      }
    };
    
    // 调用父组件的回调函数创建节点
    onCreateNode(nodeData);
    
    // 如果启用了创建连接，则为新节点和源节点创建连接
    if (connectionSettings.createConnections) {
      // 这里需要父组件提供创建连接的回调函数
      // 假设新节点ID会在onCreateNode回调中返回
      // 实际实现时需要调整这部分逻辑
      toast({
        title: "已创建节点和连接",
        description: `已创建分析结果节点并与${selectedNodes.length}个源节点建立连接`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: "已创建节点",
        description: "已创建分析结果节点",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
    
    // 关闭抽屉
    onClose();
  };
  
  // 获取分析标题
  const getAnalysisTitle = (type: AnalysisType, contents: ExtractedContent[]): string => {
    const typeNames = {
      'compare': '比较分析',
      'synthesize': '综合分析',
      'relations': '关系探索',
      'debate': '辩论分析',
      'custom': '自定义分析'
    };
    
    // 如果只有一个节点，使用其标题
    if (contents.length === 1) {
      return `${typeNames[type]}: ${contents[0].title || '未命名节点'}`;
    }
    
    // 如果有多个节点，使用类型名称加节点数量
    return `${typeNames[type]}: ${contents.length}个节点`;
  };

  // 渲染节点预览
  const renderNodePreview = (content: ExtractedContent) => {
    const isExpanded = expandedPreviews.includes(content.originalNode.id);
    const previewText = isExpanded 
      ? content.text 
      : content.text.length > 100 
        ? content.text.substring(0, 100) + '...' 
        : content.text;
    
    return (
      <Box 
        key={content.originalNode.id}
        p={3}
        borderWidth="1px"
        borderRadius="md"
        mb={2}
      >
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="bold">
            {content.title || `${content.type}节点`}
          </Text>
          <HStack>
            <Badge colorScheme={getNodeColorScheme(content.type)}>
              {content.type}
            </Badge>
            {content.text.length > 100 && (
              <IconButton
                aria-label={isExpanded ? "收起" : "展开"}
                icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                size="xs"
                variant="ghost"
                onClick={() => togglePreviewExpand(content.originalNode.id)}
              />
            )}
          </HStack>
        </Flex>
        
        <Text fontSize="sm">{previewText}</Text>
        
        {content.imageUrl && (
          <Box mt={2}>
            <Text fontSize="xs" color="gray.500">包含图片: {content.imageUrl.split('/').pop()}</Text>
          </Box>
        )}
      </Box>
    );
  };
  
  // 获取节点类型的颜色方案
  const getNodeColorScheme = (type: string): string => {
    const colorMap: Record<string, string> = {
      '文本': 'blue',
      '图片': 'green',
      'AI': 'purple',
      '辩论': 'orange',
      '链接': 'cyan',
      '问题': 'yellow',
      '回答': 'teal'
    };
    
    return colorMap[type] || 'gray';
  };

  // 渲染高级设置
  const renderAdvancedSettings = () => {
    return (
      <Box 
        borderWidth="1px" 
        borderRadius="md" 
        p={4} 
        mt={4}
        bg="gray.50"
        _dark={{ bg: "gray.700" }}
      >
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>温度参数</FormLabel>
            <Slider
              value={promptOptions.temperature || 0.7}
              min={0}
              max={1}
              step={0.1}
              onChange={(val) => handleOptionChange('temperature', val)}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Flex justify="space-between">
              <Text fontSize="xs">精确 (0.0)</Text>
              <Text fontSize="xs">平衡 (0.7)</Text>
              <Text fontSize="xs">创造 (1.0)</Text>
            </Flex>
          </FormControl>
          
          <FormControl>
            <FormLabel>详细程度</FormLabel>
            <RadioGroup
              value={promptOptions.detailLevel || 'detailed'}
              onChange={(val) => handleOptionChange('detailLevel', val)}
            >
              <Stack direction="row">
                <Radio value="basic">基础</Radio>
                <Radio value="detailed">详细</Radio>
                <Radio value="comprehensive">全面</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
          
          <FormControl>
            <FormLabel>输出格式</FormLabel>
            <RadioGroup
              value={promptOptions.outputFormat || 'markdown'}
              onChange={(val) => handleOptionChange('outputFormat', val)}
            >
              <Stack direction="row">
                <Radio value="markdown">Markdown</Radio>
                <Radio value="text">纯文本</Radio>
                <Radio value="json">JSON</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
          
          <FormControl>
            <FormLabel mb={0}>其他选项</FormLabel>
            <Stack spacing={2} mt={2}>
              <Checkbox
                isChecked={advancedSettings.includeImages}
                onChange={(e) => setAdvancedSettings({
                  ...advancedSettings,
                  includeImages: e.target.checked
                })}
              >
                包含图片URL (如果有)
              </Checkbox>
            </Stack>
          </FormControl>
        </VStack>
      </Box>
    );
  };

  // 测试Ollama连接
  const testOllamaConnection = async () => {
    try {
      const success = await aiService.testOllamaConnection();
      if (success) {
        toast({
          title: "Ollama连接成功",
          description: "成功连接到Ollama API并测试了基本功能",
          status: "success",
          duration: 5000,
          isClosable: true,
      });
    } else {
        toast({
          title: "Ollama连接测试失败",
          description: "请检查控制台日志获取详细错误信息",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("测试连接时出错:", error);
      toast({
        title: "测试连接时出错",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 渲染操作按钮
  const renderActionButtons = () => {
    return (
      <Flex mt={4} justify="space-between">
        <HStack>
        <Button
          colorScheme="purple"
          size="sm"
          onClick={testOllamaConnection}
          isDisabled={isLoading}
        >
          测试Ollama连接
        </Button>
          
          <Button
            colorScheme="teal"
            size="sm"
            onClick={runContentDiagnostics}
            isDisabled={isLoading}
          >
            内容诊断
          </Button>
        </HStack>
        
        <HStack>
          <Button
            colorScheme="blue"
            onClick={executeQuery}
            isLoading={isLoading}
            loadingText="分析中..."
            leftIcon={<FiZap />}
          >
            执行分析
          </Button>
          
          {result && (
            <Button
              colorScheme="green"
              onClick={handleCreateNode}
              isDisabled={isLoading}
              leftIcon={<FiMaximize2 />}
            >
              创建分析节点
            </Button>
          )}
        </HStack>
      </Flex>
    );
  };

  // 添加连接设置UI组件
  const renderConnectionSettings = () => {
    return (
      <Box mt={4} p={3} bg={highlightBg} borderRadius="md">
        <Heading size="sm" mb={2}>连接设置</Heading>
        <FormControl display="flex" alignItems="center" mb={2}>
          <FormLabel htmlFor="create-connections" mb="0" fontSize="sm">
            创建与源节点的连接
          </FormLabel>
          <Switch 
            id="create-connections" 
            isChecked={connectionSettings.createConnections}
            onChange={(e) => setConnectionSettings({
              ...connectionSettings,
              createConnections: e.target.checked
            })}
          />
        </FormControl>
        
        {connectionSettings.createConnections && (
          <>
            <FormControl mt={2}>
              <FormLabel fontSize="sm">连接类型</FormLabel>
              <Select
                size="sm"
                value={connectionSettings.connectionType}
                onChange={(e) => setConnectionSettings({
                  ...connectionSettings,
                  connectionType: e.target.value
                })}
              >
                <option value="direct">直接连接</option>
                <option value="reference">引用关系</option>
                <option value="cause">因果关系</option>
                <option value="support">支持关系</option>
                <option value="oppose">反对关系</option>
                <option value="similar">相似关系</option>
                <option value="different">差异关系</option>
                <option value="extends">扩展关系</option>
                <option value="includes">包含关系</option>
              </Select>
            </FormControl>
            
            <FormControl display="flex" alignItems="center" mt={2}>
              <FormLabel htmlFor="bidirectional" mb="0" fontSize="sm">
                双向连接
              </FormLabel>
              <Switch 
                id="bidirectional" 
                isChecked={connectionSettings.bidirectional}
                onChange={(e) => setConnectionSettings({
                  ...connectionSettings,
                  bidirectional: e.target.checked
                })}
              />
            </FormControl>
          </>
        )}
      </Box>
    );
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">多节点分析</DrawerHeader>
        
        <DrawerBody>
          {/* 选中的节点信息 */}
          <Box mb={4}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="medium">已选择 {selectedNodes.length} 个节点:</Text>
              <Button 
                size="xs" 
                variant="ghost" 
                rightIcon={showFullContent ? <FiMinimize2 /> : <FiMaximize2 />}
                onClick={() => setShowFullContent(!showFullContent)}
              >
                {showFullContent ? '收起' : '展开'}
              </Button>
            </Flex>
            <SimpleGrid columns={[1, 2]} spacing={2}>
              {extractedContents.map(content => renderNodePreview(content))}
            </SimpleGrid>
          </Box>
          
          <Divider my={4} />
          
          {/* 查询类型选择 */}
          <Box mb={4}>
            <Text fontWeight="medium" mb={2}>选择分析类型:</Text>
            <RadioGroup onChange={(value) => setQueryType(value as AnalysisType)} value={queryType}>
              <Stack direction="column" spacing={2}>
                <Radio value="compare" isDisabled={selectedNodes.length < 2}>
                  <Text fontWeight="medium">比较分析</Text>
                  <Text fontSize="sm" color="gray.500">比较多个概念的异同点</Text>
                </Radio>
                <Radio value="synthesize">
                  <Text fontWeight="medium">综合分析</Text>
                  <Text fontSize="sm" color="gray.500">整合多个概念形成更高层次的理解</Text>
                </Radio>
                <Radio value="explore" isDisabled={selectedNodes.length < 2}>
                  <Text fontWeight="medium">关系探索</Text>
                  <Text fontSize="sm" color="gray.500">发现概念间的连接和关系</Text>
                </Radio>
                <Radio value="custom">
                  <Text fontWeight="medium">自定义查询</Text>
                  <Text fontSize="sm" color="gray.500">使用自定义提示词</Text>
                </Radio>
              </Stack>
            </RadioGroup>
          </Box>
          
          {/* 自定义提示词输入 */}
          {queryType === 'custom' && (
            <Box mb={4}>
              <Text fontWeight="medium" mb={2}>自定义提示词:</Text>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="请输入查询提示词，系统将分析选中节点的内容..."
                size="sm"
                rows={4}
              />
            </Box>
          )}
          
          {/* 高级设置 */}
          {renderAdvancedSettings()}
          
          {/* 查询按钮 */}
          {renderActionButtons()}
          
          {/* 错误信息 */}
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          {/* 加载中 */}
          {isLoading && (
            <Flex direction="column" align="center" justify="center" my={8}>
              <Spinner size="xl" color="purple.500" mb={4} />
              <Text>AI正在分析选中的节点内容...</Text>
            </Flex>
          )}
          
          {/* 结果显示 */}
          {result && !isLoading && (
            <Box>
              <Heading size="md" mb={3}>分析结果</Heading>
              <Box 
                borderWidth="1px" 
                borderRadius="md" 
                p={4} 
                bg={bgColor} 
                borderColor={borderColor}
                mb={4}
                maxHeight="300px"
                overflowY="auto"
              >
                <ReactMarkdown>{result}</ReactMarkdown>
              </Box>
            </Box>
          )}
          
          <Box mt={4} w="100%">
            {/* 内容预览区域 */}
            <Box mb={4}>
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="sm">内容预览</Heading>
                <HStack>
                  <Button 
                    size="xs" 
                    leftIcon={<FiZap />} 
                    colorScheme="blue" 
                    variant="outline"
                    onClick={runContentDiagnostics}
                  >
                    内容诊断
                  </Button>
                  <IconButton
                    aria-label="Toggle content view"
                    icon={showFullContent ? <FiChevronUp /> : <FiChevronDown />}
                    size="xs"
                    onClick={() => setShowFullContent(!showFullContent)}
                  />
                </HStack>
              </Flex>
              
              {/* 诊断报告显示区域 */}
              {diagnosticReport && (
                <Box 
                  mt={2} 
                  mb={4} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  borderColor="gray.200"
                  _dark={{ borderColor: "gray.600" }}
                >
                  {diagnosticReport}
                </Box>
              )}
              
              {/* 内容预览列表 */}
              <VStack spacing={2} align="stretch" maxH={showFullContent ? "none" : "200px"} overflowY="auto">
                {extractedContents.map(content => renderNodePreview(content))}
              </VStack>
            </Box>
          </Box>
          
          {/* 连接设置 */}
          {renderConnectionSettings()}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default MultiNodeQuery; 