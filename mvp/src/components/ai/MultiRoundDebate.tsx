import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Radio,
  RadioGroup,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
  Badge,
  HStack,
  Progress,
  Input,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  List,
  ListItem,
  Switch,
  Spinner,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FiUser,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiSettings,
  FiSave,
  FiRepeat,
  FiActivity,
  FiMessageSquare
} from 'react-icons/fi';
import { DeleteIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import aiService from '../../api/aiService';
import { ContentExtractor, ExtractedContent } from '../../api/ContentExtractor';
import { INode } from '../../types/graph'; // 导入统一的INode类型

// 辩论轮次接口
interface DebateRound {
  id: string;
  model: string;    // 使用的模型
  content: string;  // 生成的内容
  role: string;     // 角色或立场
  timestamp: Date;  // 时间戳
  referencedRound?: string; // 引用的上一轮ID
}

// 辩论参与者接口
interface DebateParticipant {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  role: string;  // 角色或立场
  color: string; // 显示颜色
}

// 组件属性接口
interface MultiRoundDebateProps {
  selectedNodes: INode[];
  onAddNode: (node: any) => string; // 返回创建的节点ID
  onAddEdge: (edge: any) => string; // 返回创建的边ID
}

/**
 * 多轮辩论组件
 * 
 * 这个组件实现了一种高级辩证思维的AI辅助功能，允许用户：
 * 1. 设置多个AI参与者进行辩论
 * 2. 连续多轮讨论，每轮由不同立场的AI提出观点
 * 3. 实现辩证式思考，对同一问题从不同角度进行深入剖析
 * 4. 可视化整个辩论过程，并将结果保存到图谱
 */
const MultiRoundDebate: React.FC<MultiRoundDebateProps> = ({
  selectedNodes,
  onAddNode,
  onAddEdge
}) => {
  // 颜色设置
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('purple.500', 'purple.300');
  const highlightBg = useColorModeValue('purple.50', 'purple.900');
  
  // Toast通知
  const toast = useToast();
  
  // 状态管理
  const [topic, setTopic] = useState('');
  const [debateRounds, setDebateRounds] = useState<DebateRound[]>([]);
  const [participants, setParticipants] = useState<DebateParticipant[]>([
    {
      id: `participant_${Date.now()}_1`,
      name: '正方观点',
      model: 'qwen2.5:7b',
      systemPrompt: '你是一个辩论专家，持有支持的立场。使用逻辑和事实来支持你的观点。',
      role: '支持方',
      color: 'blue.500'
    },
    {
      id: `participant_${Date.now()}_2`,
      name: '反方观点',
      model: 'qwen2.5:7b',
      systemPrompt: '你是一个辩论专家，持有反对的立场。批判性思考并指出对方论点的问题。',
      role: '反对方',
      color: 'red.500'
    }
  ]);
  const [newParticipant, setNewParticipant] = useState<Partial<DebateParticipant>>({
    name: '',
    model: 'qwen2.5:7b',
    role: '',
    systemPrompt: '你是一个辩论专家，请基于提供的辩题和自己的立场发表观点。'
  });
  
  const [roundsCount, setRoundsCount] = useState(10); // 默认10轮
  const [currentRound, setCurrentRound] = useState(0);
  const [isGeneratingRound, setIsGeneratingRound] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedContents, setExtractedContents] = useState<ExtractedContent[]>([]);
  
  // 高级设置的模型选择
  const [availableModels, setAvailableModels] = useState<string[]>([
    'qwen2.5:7b',
    'gpt-3.5-turbo',
    'gpt-4',
    'claude-3-sonnet'
  ]);
  
  // 当组件加载时获取可用模型
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await aiService.getAvailableModels();
        setAvailableModels(models.map(model => model.id));
      } catch (error) {
        console.error('获取模型列表失败:', error);
      }
    };
    
    fetchModels();
  }, []);
  
  // 当选中的节点改变时更新话题
  useEffect(() => {
    if (selectedNodes.length > 0) {
      try {
        // 使用ContentExtractor提取节点内容
        const contents = ContentExtractor.extractMultipleContents(selectedNodes);
        setExtractedContents(contents);
        
        // 从第一个节点提取内容作为讨论话题
        if (contents.length > 0) {
          const firstNodeContent = contents[0];
          setTopic(firstNodeContent.title || firstNodeContent.text.substring(0, 50));
        }
      } catch (error) {
        console.error("提取节点内容失败:", error);
        toast({
          title: "内容提取错误",
          description: "无法从所选节点提取内容",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [selectedNodes, toast]);
  
  // 获取选中节点的内容
  const getSelectedNodesContent = () => {
    console.log(`开始提取 ${selectedNodes.length} 个节点的内容`);
    
    // 检查节点有效性
    if (selectedNodes.length === 0) {
      console.warn('没有选择节点');
      setExtractedContents([]);
      return [];
    }
    
    try {
      // 提取内容
      const contents = ContentExtractor.extractMultipleContents(selectedNodes);
      console.log(`提取完成，获取到 ${contents.length} 个内容对象`);
      return contents;
    } catch (error) {
      console.error("提取节点内容失败:", error);
      return [];
    }
  };
  
  // 添加参与者
  const addParticipant = () => {
    if (!newParticipant.name || !newParticipant.model || !newParticipant.role) {
      toast({
        title: "请填写完整的参与者信息",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 生成随机颜色
    const colors = ['red.500', 'blue.500', 'green.500', 'purple.500', 'orange.500', 'teal.500', 'pink.500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newId = `participant_${Date.now()}`;
    const participant: DebateParticipant = {
      id: newId,
      name: newParticipant.name || `参与者 ${participants.length + 1}`,
      model: newParticipant.model || 'qwen2.5:7b',
      systemPrompt: newParticipant.systemPrompt || '你是一个辩论专家，请针对提供的辩题发表你的观点。',
      role: newParticipant.role || '未指定立场',
      color: randomColor
    };
    
    setParticipants([...participants, participant]);
    
    // 重置表单
    setNewParticipant({
      name: '',
      model: 'qwen2.5:7b',
      role: '',
      systemPrompt: '你是一个辩论专家，请基于提供的辩题和自己的立场发表观点。'
    });
    
    toast({
      title: "添加参与者成功",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // 删除参与者
  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };
  
  // 开始多轮辩论
  const startMultiRoundDebate = async () => {
    if (participants.length < 2) {
      toast({
        title: "参与者不足",
        description: "多轮辩论至少需要2个参与者",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!topic.trim()) {
      toast({
        title: "请输入讨论话题",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 重置辩论轮次
    setDebateRounds([]);
    setCurrentRound(0);
    
    // 生成第一轮辩论
    await generateNextDebateRound();
  };
  
  // 生成下一轮辩论
  const generateNextDebateRound = async () => {
    if (debateRounds.length >= roundsCount) {
      toast({
        title: "辩论已完成",
        description: `已达到设定的${roundsCount}轮次`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsGeneratingRound(true);
    
    try {
      // 确定当前参与者
      const participantIndex = debateRounds.length % participants.length;
      const currentParticipant = participants[participantIndex];
      
      // 获取上一轮辩论内容(如果有)
      let previousRound: DebateRound | undefined;
      if (debateRounds.length > 0) {
        previousRound = debateRounds[debateRounds.length - 1];
      }
      
      // 构建系统提示词
      const systemPrompt = currentParticipant.systemPrompt || 
        `你是一个辩论专家，你的立场是"${currentParticipant.role}"。请基于已有讨论，提出你的观点和论据。`;
      
      // 构建用户提示词
      let userPrompt = `辩题: ${topic}\n\n`;
      
      // 添加背景信息
      const contents = getSelectedNodesContent();
      if (contents.length > 0) {
        const backgroundInfo = contents.map(content => {
          return `- ${content.title || '节点'}: ${content.text.substring(0, 150)}${content.text.length > 150 ? '...' : ''}`;
        }).join('\n');
        
        userPrompt += `相关背景信息:\n${backgroundInfo}\n\n`;
      }
      
      // 添加已有辩论轮次
      if (debateRounds.length > 0) {
        userPrompt += "已有讨论:\n";
        debateRounds.forEach((round, index) => {
          const participant = participants.find(p => 
            round.model === p.model && round.role === p.role
          );
          userPrompt += `${participant?.name || '参与者'} (${round.role}): ${round.content.substring(0, 300)}${round.content.length > 300 ? '...' : ''}\n\n`;
        });
      }
      
      // 添加当前任务
      userPrompt += `\n你的任务:\n作为${currentParticipant.name} (${currentParticipant.role})，请针对上述辩题${debateRounds.length > 0 ? '和已有讨论' : ''}发表你的观点，`;
      
      if (previousRound) {
        userPrompt += `特别是针对${participants.find(p => p.role === previousRound?.role)?.name || '上一位发言者'}的观点进行回应和批判。`;
      } else {
        userPrompt += `阐述你的立场和论据。`;
      }
      
      userPrompt += `\n请提供有理有据的论述，尽量使用事实和逻辑支持你的观点。请只输出你的观点内容，不要包含角色扮演的描述。使用Markdown格式输出。`;
      
      console.log(`生成辩论轮次 ${debateRounds.length + 1}/${roundsCount}`, {
        participant: currentParticipant.name,
        model: currentParticipant.model,
        role: currentParticipant.role,
        promptLength: systemPrompt.length + userPrompt.length
      });
      
      // 使用aiService发送请求
      const response = await aiService.sendRequest({
        model: currentParticipant.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        maxTokens: 1024,
        provider: currentParticipant.model.includes(':') ? 'ollama' : 'openai',
        stream: false
      });
      
      // 创建新的辩论轮次
      const newRound: DebateRound = {
        id: `round_${Date.now()}`,
        model: currentParticipant.model,
        content: response.text,
        role: currentParticipant.role,
        timestamp: new Date(),
        referencedRound: previousRound?.id
      };
      
      // 更新辩论轮次
      setDebateRounds([...debateRounds, newRound]);
      setCurrentRound(debateRounds.length + 1);
      
      // 如果设置了自动继续且未达到轮次限制，则自动生成下一轮
      if (autoAdvance && debateRounds.length + 1 < roundsCount) {
        setTimeout(() => {
          generateNextDebateRound();
        }, 1000);
      }
    } catch (error) {
      console.error("生成辩论轮次失败:", error);
      toast({
        title: "生成辩论内容失败",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingRound(false);
    }
  };
  
  // 计算节点位置
  const calculatePosition = (index: number, total: number) => {
    const radius = 250;
    const angle = (index / total) * Math.PI * 2;
    const centerX = 0;
    const centerY = 0;
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };
  
  // 保存辩论结果到图谱
  const saveMultiRoundDebate = async () => {
    if (debateRounds.length === 0) {
      toast({
        title: "没有辩论内容可保存",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 创建辩论分析内容
      const debateContent = debateRounds.map((round, index) => {
        const participant = participants.find(p => p.role === round.role);
        return `## 第${index + 1}轮: ${participant?.name || '参与者'} (${round.role})\n\n${round.content}\n\n`;
      }).join('---\n\n');
      
      // 创建辩论节点
      const debateNode = {
        id: `debate_${Date.now()}`,
        type: 'debate' as const,
        position: calculatePosition(0, 1),
        data: {
          topic: topic,
          perspectives: participants.map(p => `${p.name}: ${p.role}`),
          analysis: debateContent,
          persuasiveView: '',
          settings: {
            debateStyle: 'balanced' as const,
            complexity: 5,
            model: participants.map(p => p.model).join(', ')
          }
        }
      };
      
      // 保存节点到图谱
      const debateNodeId = onAddNode(debateNode);
      
      // 创建与所有选中节点的连接
      if (selectedNodes.length > 0) {
        selectedNodes.forEach((sourceNode) => {
          const edge = {
            id: `edge_${sourceNode.id}_${debateNodeId}`,
            source: sourceNode.id,
            target: debateNodeId,
            type: 'reference' as const,
            label: '辩论分析源'
          };
          onAddEdge(edge);
        });
      }
      
      toast({
        title: "辩论内容已保存到图谱",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("保存辩论内容失败:", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 移除外层Drawer，直接返回内容
  return (
    <VStack spacing={4} align="stretch" mt={4} mb={4}>
      <Box borderWidth="1px" borderRadius="lg" p={4}>
        <Heading size="md" mb={4}>辩论参与者设置</Heading>
        
        {/* 添加参与者表单 */}
        <SimpleGrid columns={[1, null, 2]} spacing={4} mb={4}>
          <FormControl>
            <FormLabel>参与者名称</FormLabel>
            <Input 
              placeholder="例如：正方观点" 
              value={newParticipant.name}
              onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>立场/角色</FormLabel>
            <Input 
              placeholder="例如：支持方" 
              value={newParticipant.role}
              onChange={(e) => setNewParticipant({...newParticipant, role: e.target.value})}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>使用的模型</FormLabel>
            <Select 
              value={newParticipant.model}
              onChange={(e) => setNewParticipant({...newParticipant, model: e.target.value})}
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>系统提示词</FormLabel>
            <Textarea 
              placeholder="设置AI的行为和角色定位"
              value={newParticipant.systemPrompt}
              onChange={(e) => setNewParticipant({...newParticipant, systemPrompt: e.target.value})}
            />
          </FormControl>
        </SimpleGrid>
        
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="purple" 
          onClick={addParticipant}
          mb={4}
        >
          添加参与者
        </Button>
        
        {/* 参与者列表 */}
        {participants.length > 0 && (
          <Box mt={4}>
            <Heading size="sm" mb={2}>已添加的参与者：</Heading>
            <SimpleGrid columns={[1, null, 2]} spacing={3}>
              {participants.map(participant => (
                <HStack 
                  key={participant.id} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  p={2}
                  borderLeftWidth="4px"
                  borderLeftColor={participant.color}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                >
                  <Box flex="1">
                    <Text fontWeight="bold">{participant.name}</Text>
                    <Text fontSize="sm">角色: {participant.role}</Text>
                    <Text fontSize="sm">模型: {participant.model}</Text>
                  </Box>
                  <IconButton
                    icon={<DeleteIcon />}
                    aria-label="删除参与者"
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => removeParticipant(participant.id)}
                  />
                </HStack>
              ))}
            </SimpleGrid>
          </Box>
        )}
        
        {/* 辩论轮次设置 */}
        <FormControl mt={4}>
          <FormLabel>辩论轮次</FormLabel>
          <HStack>
            <Slider
              value={roundsCount}
              min={2}
              max={15}
              onChange={(val) => setRoundsCount(val)}
              flex="1"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Text width="40px" textAlign="center">{roundsCount}</Text>
          </HStack>
        </FormControl>
        
        <FormControl mt={4}>
          <HStack>
            <Switch 
              id="auto-advance"
              isChecked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
            />
            <FormLabel htmlFor="auto-advance" mb="0">
              自动进行连续辩论
            </FormLabel>
          </HStack>
          <FormHelperText>启用后将自动生成所有轮次的辩论内容</FormHelperText>
        </FormControl>
      </Box>
      
      {/* 辩论主题 */}
      <Box borderWidth="1px" borderRadius="lg" p={4}>
        <Heading size="md" mb={4}>辩论主题</Heading>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="输入辩论主题..."
          mb={4}
        />
        
        <Button
          colorScheme="purple"
          leftIcon={<FiActivity />}
          onClick={startMultiRoundDebate}
          isLoading={isGeneratingRound}
          loadingText="生成中..."
          isDisabled={participants.length < 2 || !topic.trim()}
        >
          开始多轮辩论
        </Button>
      </Box>
      
      {/* 辩论内容显示 */}
      {debateRounds.length > 0 && (
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Heading size="md" mb={4}>辩论过程</Heading>
          
          <HStack mb={4} justify="space-between">
            <Text>已完成 {debateRounds.length}/{roundsCount} 轮</Text>
            
            {debateRounds.length < roundsCount && !isGeneratingRound && !autoAdvance && (
              <Button
                leftIcon={<FiRepeat />}
                onClick={generateNextDebateRound}
                colorScheme="blue"
                size="sm"
              >
                生成下一轮
              </Button>
            )}
            
            {debateRounds.length > 0 && (
              <Button
                leftIcon={<FiSave />}
                onClick={saveMultiRoundDebate}
                colorScheme="green"
                size="sm"
                isLoading={isSaving}
              >
                保存到图谱
              </Button>
            )}
          </HStack>
          
          <Progress 
            value={(debateRounds.length / roundsCount) * 100} 
            colorScheme="purple" 
            mb={4}
            hasStripe={isGeneratingRound}
            isAnimated={isGeneratingRound}
          />
          
          {/* 辩论轮次内容 */}
          <VStack spacing={4} align="stretch" maxH="600px" overflowY="auto" pr={2}>
            {debateRounds.map((round, index) => {
              const participant = participants.find(p => p.role === round.role);
              
              return (
                <Box 
                  key={round.id} 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  p={4}
                  borderLeftWidth="4px"
                  borderLeftColor={participant?.color || 'gray.500'}
                >
                  <HStack mb={2} justify="space-between">
                    <HStack>
                      <Icon as={FiUser} />
                      <Text fontWeight="bold">{participant?.name || '参与者'}</Text>
                      <Badge>{round.role}</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      轮次 {index + 1}/{roundsCount}
                    </Text>
                  </HStack>
                  
                  <Box 
                    borderRadius="md" 
                    bg={useColorModeValue('gray.50', 'gray.700')} 
                    p={3}
                    mt={2}
                  >
                    <ReactMarkdown>{round.content}</ReactMarkdown>
                  </Box>
                  
                  <HStack mt={2} fontSize="sm" color="gray.500">
                    <Text>模型: {round.model}</Text>
                    <Text>·</Text>
                    <Text>
                      {new Date(round.timestamp).toLocaleString()}
                    </Text>
                  </HStack>
                </Box>
              );
            })}
            
            {isGeneratingRound && (
              <Box 
                borderWidth="1px" 
                borderRadius="lg" 
                p={4}
                borderStyle="dashed"
              >
                <HStack justify="center">
                  <Spinner size="sm" />
                  <Text>生成辩论内容中...</Text>
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default MultiRoundDebate; 