import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Flex,
  IconButton,
  Input,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Tooltip,
  useDisclosure,
  Collapse,
  Spinner,
  useToast,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Radio,
  RadioGroup,
  Stack
} from '@chakra-ui/react';
import { FiMoreVertical, FiEdit, FiTrash2, FiPlus, FiCheck, FiX, FiSend, FiSettings, FiChevronDown, FiChevronUp, FiRefreshCw, FiZap } from 'react-icons/fi';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDispatch, useSelector } from 'react-redux';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import { RootState } from '@store/index';
import { INode, IAIAgentNode } from '@types/graph';
import aiAgentService, { AgentOptions, NodeGenerationOptions, RelationInferenceOptions } from '@api/AIAgentService';
import aiService, { AIProvider } from '@api/aiService';
import { v4 as uuidv4 } from 'uuid';

// 定义AI代理节点的操作模式
type AgentMode = 'generate' | 'connect' | 'analyze';

// AI代理节点组件
const AIAgentNode: React.FC<NodeProps<IAIAgentNode>> = ({ id, data, selected }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const nodes = useSelector((state: RootState) => state.nodes.nodes);
  const edges = useSelector((state: RootState) => state.nodes.edges);
  
  // 设置AI代理服务的dispatch和状态
  useEffect(() => {
    aiAgentService.setDispatch(dispatch);
    aiAgentService.updateState(nodes, edges);
  }, [dispatch, nodes, edges]);
  
  // 状态管理
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AgentMode>(data?.mode || 'generate');
  const [result, setResult] = useState<string>(data?.result || '');
  const [error, setError] = useState<string>('');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(data?.selectedNodeIds || []);
  
  // 节点生成选项
  const [generationCount, setGenerationCount] = useState<number>(data?.generationOptions?.count || 3);
  const [generationNodeType, setGenerationNodeType] = useState<'text' | 'ai'>(data?.generationOptions?.nodeType || 'text');
  const [generationTopic, setGenerationTopic] = useState<string>(data?.generationOptions?.topic || '');
  
  // 关系推断选项
  const [relationTypes, setRelationTypes] = useState<string[]>(data?.relationOptions?.relationTypes || []);
  const [newRelationType, setNewRelationType] = useState<string>('');
  const [bidirectional, setBidirectional] = useState<boolean>(data?.relationOptions?.bidirectional || false);
  
  // AI模型选项
  const [provider, setProvider] = useState<AIProvider>(data?.agentOptions?.provider || 'openai');
  const [model, setModel] = useState<string>(data?.agentOptions?.model || '');
  const [temperature, setTemperature] = useState<number>(data?.agentOptions?.temperature || 0.7);
  const [systemPrompt, setSystemPrompt] = useState<string>(data?.agentOptions?.systemPrompt || '');
  
  // 可用模型列表
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // 获取可用模型
  useEffect(() => {
    const models = aiService.getAvailableModels(provider);
    setAvailableModels(models);
    
    // 如果当前选择的模型不在可用列表中，选择第一个可用模型
    if (models.length > 0 && !models.includes(model)) {
      setModel(models[0]);
    }
  }, [provider]);
  
  // 保存节点数据
  const saveNodeData = () => {
    const updatedNode: IAIAgentNode = {
      id,
      type: 'aiagent',
      position: (nodes.find(n => n.id === id) as INode).position,
      data: {
        mode,
        result,
        selectedNodeIds,
        generationOptions: {
          count: generationCount,
          nodeType: generationNodeType,
          topic: generationTopic
        },
        relationOptions: {
          relationTypes,
          bidirectional
        },
        agentOptions: {
          provider,
          model,
          temperature,
          systemPrompt
        }
      }
    };
    
    dispatch(updateNode(updatedNode));
  };
  
  // 当重要状态改变时保存节点数据
  useEffect(() => {
    saveNodeData();
  }, [mode, result, selectedNodeIds, provider, model, temperature]);
  
  // 添加关系类型
  const addRelationType = () => {
    if (newRelationType.trim() && !relationTypes.includes(newRelationType.trim())) {
      const updatedTypes = [...relationTypes, newRelationType.trim()];
      setRelationTypes(updatedTypes);
      setNewRelationType('');
    }
  };
  
  // 删除关系类型
  const removeRelationType = (type: string) => {
    setRelationTypes(relationTypes.filter(t => t !== type));
  };
  
  // 执行AI代理操作
  const executeAgentAction = async () => {
    if (!model) {
      setError('请选择AI模型');
      return;
    }
    
    if (selectedNodeIds.length === 0 && mode !== 'generate') {
      setError('请选择至少一个节点');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const agentOptions: AgentOptions = {
        provider,
        model,
        temperature,
        systemPrompt: systemPrompt || undefined
      };
      
      let actionResult = '';
      
      switch (mode) {
        case 'generate':
          const nodeOptions: NodeGenerationOptions = {
            count: generationCount,
            nodeType: generationNodeType,
            basedOnNodeIds: selectedNodeIds.length > 0 ? selectedNodeIds : undefined,
            topic: generationTopic || undefined
          };
          
          const generatedNodeIds = await aiAgentService.generateNodes(nodeOptions, agentOptions);
          actionResult = `成功生成了 ${generatedNodeIds.length} 个新节点`;
          break;
          
        case 'connect':
          if (selectedNodeIds.length < 2) {
            throw new Error('需要至少两个节点来推断关系');
          }
          
          const relationOptions: RelationInferenceOptions = {
            nodeIds: selectedNodeIds,
            relationTypes: relationTypes.length > 0 ? relationTypes : undefined,
            bidirectional
          };
          
          const createdEdgeIds = await aiAgentService.inferRelations(relationOptions, agentOptions);
          actionResult = `成功推断并创建了 ${createdEdgeIds.length} 个关系`;
          break;
          
        case 'analyze':
          const analysis = await aiAgentService.analyzeNodes(selectedNodeIds, agentOptions);
          actionResult = analysis;
          break;
      }
      
      setResult(actionResult);
      toast({
        title: '操作成功',
        description: mode === 'generate' ? '已生成新节点' : mode === 'connect' ? '已创建节点关系' : '分析完成',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      setError(errorMessage);
      toast({
        title: '操作失败',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      saveNodeData();
    }
  };
  
  // 处理节点选择
  const handleNodeSelection = (nodeId: string) => {
    if (selectedNodeIds.includes(nodeId)) {
      setSelectedNodeIds(selectedNodeIds.filter(id => id !== nodeId));
    } else {
      setSelectedNodeIds([...selectedNodeIds, nodeId]);
    }
  };
  
  // 清除所有选择的节点
  const clearSelectedNodes = () => {
    setSelectedNodeIds([]);
  };
  
  // 删除节点
  const handleDeleteNode = () => {
    dispatch(deleteNode(id));
  };
  
  // 渲染选择的节点列表
  const renderSelectedNodes = () => {
    return (
      <Box mt={2}>
        <Text fontSize="sm" fontWeight="bold" mb={1}>
          已选择的节点 ({selectedNodeIds.length})
        </Text>
        <Flex flexWrap="wrap" gap={2}>
          {selectedNodeIds.map(nodeId => {
            const node = nodes.find(n => n.id === nodeId);
            const nodeTitle = node?.type === 'text' 
              ? (node.data?.content || '').split('\n')[0].replace(/^#+ /, '').substring(0, 20)
              : node?.type === 'ai'
                ? (node.data?.prompt || '').substring(0, 20)
                : nodeId.substring(0, 8);
                
            return (
              <Tag 
                key={nodeId} 
                size="sm" 
                borderRadius="full" 
                variant="solid" 
                colorScheme="blue"
              >
                <TagLabel title={nodeId}>{nodeTitle}{nodeTitle.length >= 20 ? '...' : ''}</TagLabel>
                <TagCloseButton onClick={() => handleNodeSelection(nodeId)} />
              </Tag>
            );
          })}
          {selectedNodeIds.length > 0 && (
            <Button size="xs" onClick={clearSelectedNodes} leftIcon={<FiX />} variant="ghost">
              清除全部
            </Button>
          )}
        </Flex>
      </Box>
    );
  };
  
  return (
    <Box
      padding={3}
      borderWidth={selected ? 2 : 1}
      borderRadius="md"
      borderColor={selected ? 'blue.500' : 'gray.200'}
      bg="white"
      width={350}
      boxShadow="md"
    >
      {/* 输入和输出连接点 */}
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
      
      {/* 节点头部 */}
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Flex alignItems="center">
          <Text fontWeight="bold" fontSize="md">AI代理</Text>
          <Badge ml={2} colorScheme={
            mode === 'generate' ? 'green' : 
            mode === 'connect' ? 'purple' : 
            'blue'
          }>
            {mode === 'generate' ? '生成节点' : 
             mode === 'connect' ? '推断关系' : 
             '分析内容'}
          </Badge>
        </Flex>
        
        <Flex>
          <IconButton
            aria-label="设置"
            icon={isSettingsOpen ? <FiChevronUp /> : <FiChevronDown />}
            size="sm"
            variant="ghost"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="更多选项"
              icon={<FiMoreVertical />}
              size="sm"
              variant="ghost"
            />
            <MenuList>
              <MenuItem icon={<FiTrash2 />} onClick={handleDeleteNode}>
                删除节点
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
      
      {/* 模式选择 */}
      <RadioGroup onChange={(value) => setMode(value as AgentMode)} value={mode} mb={3}>
        <Stack direction="row" spacing={4}>
          <Radio value="generate">生成节点</Radio>
          <Radio value="connect">推断关系</Radio>
          <Radio value="analyze">分析内容</Radio>
        </Stack>
      </RadioGroup>
      
      {/* 设置区域 */}
      <Collapse in={isSettingsOpen} animateOpacity>
        <Box p={2} bg="gray.50" borderRadius="md" mb={3}>
          <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
            <TabList>
              <Tab>AI模型</Tab>
              <Tab>操作选项</Tab>
            </TabList>
            
            <TabPanels>
              {/* AI模型设置 */}
              <TabPanel>
                <FormControl mb={2}>
                  <FormLabel fontSize="sm">AI提供商</FormLabel>
                  <Select 
                    size="sm" 
                    value={provider} 
                    onChange={(e) => setProvider(e.target.value as AIProvider)}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="gemini">Gemini</option>
                    <option value="qwen">Qwen</option>
                    <option value="groq">Groq</option>
                    <option value="ollama">Ollama</option>
                    <option value="custom">自定义</option>
                  </Select>
                </FormControl>
                
                <FormControl mb={2}>
                  <FormLabel fontSize="sm">模型</FormLabel>
                  <Select 
                    size="sm" 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl mb={2}>
                  <FormLabel fontSize="sm">温度 ({temperature})</FormLabel>
                  <NumberInput 
                    size="sm" 
                    min={0} 
                    max={2} 
                    step={0.1} 
                    value={temperature} 
                    onChange={(_, value) => setTemperature(value)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl mb={2}>
                  <FormLabel fontSize="sm">系统提示</FormLabel>
                  <Textarea 
                    size="sm" 
                    value={systemPrompt} 
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="自定义系统提示（可选）"
                    rows={3}
                  />
                </FormControl>
              </TabPanel>
              
              {/* 操作选项设置 */}
              <TabPanel>
                {mode === 'generate' && (
                  <>
                    <FormControl mb={2}>
                      <FormLabel fontSize="sm">生成节点数量</FormLabel>
                      <NumberInput 
                        size="sm" 
                        min={1} 
                        max={10} 
                        value={generationCount} 
                        onChange={(_, value) => setGenerationCount(value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl mb={2}>
                      <FormLabel fontSize="sm">节点类型</FormLabel>
                      <Select 
                        size="sm" 
                        value={generationNodeType} 
                        onChange={(e) => setGenerationNodeType(e.target.value as 'text' | 'ai')}
                      >
                        <option value="text">文本节点</option>
                        <option value="ai">AI节点</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl mb={2}>
                      <FormLabel fontSize="sm">主题（可选）</FormLabel>
                      <Input 
                        size="sm" 
                        value={generationTopic} 
                        onChange={(e) => setGenerationTopic(e.target.value)}
                        placeholder="输入主题或留空使用选择的节点作为上下文"
                      />
                    </FormControl>
                  </>
                )}
                
                {mode === 'connect' && (
                  <>
                    <FormControl mb={2}>
                      <FormLabel fontSize="sm">关系类型（可选）</FormLabel>
                      <Flex mb={2}>
                        <Input 
                          size="sm" 
                          value={newRelationType} 
                          onChange={(e) => setNewRelationType(e.target.value)}
                          placeholder="添加关系类型"
                          mr={2}
                        />
                        <Button size="sm" onClick={addRelationType}>添加</Button>
                      </Flex>
                      
                      <Flex flexWrap="wrap" gap={2}>
                        {relationTypes.map(type => (
                          <Tag 
                            key={type} 
                            size="sm" 
                            borderRadius="full" 
                            variant="solid" 
                            colorScheme="purple"
                          >
                            <TagLabel>{type}</TagLabel>
                            <TagCloseButton onClick={() => removeRelationType(type)} />
                          </Tag>
                        ))}
                      </Flex>
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" mb={2}>
                      <FormLabel htmlFor="bidirectional" mb="0" fontSize="sm">
                        双向关系
                      </FormLabel>
                      <Switch 
                        id="bidirectional" 
                        isChecked={bidirectional} 
                        onChange={(e) => setBidirectional(e.target.checked)} 
                      />
                    </FormControl>
                  </>
                )}
                
                {mode === 'analyze' && (
                  <Text fontSize="sm" color="gray.600">
                    选择要分析的节点，然后点击"执行"按钮获取分析结果。
                  </Text>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Collapse>
      
      {/* 选择的节点列表 */}
      {renderSelectedNodes()}
      
      {/* 执行按钮 */}
      <Button
        mt={3}
        colorScheme={
          mode === 'generate' ? 'green' : 
          mode === 'connect' ? 'purple' : 
          'blue'
        }
        leftIcon={
          mode === 'generate' ? <FiPlus /> : 
          mode === 'connect' ? <FiZap /> : 
          <FiRefreshCw />
        }
        isLoading={isLoading}
        onClick={executeAgentAction}
        width="100%"
      >
        {mode === 'generate' ? '生成节点' : 
         mode === 'connect' ? '推断关系' : 
         '分析内容'}
      </Button>
      
      {/* 错误信息 */}
      {error && (
        <Text color="red.500" fontSize="sm" mt={2}>
          {error}
        </Text>
      )}
      
      {/* 结果显示 */}
      {result && !isLoading && (
        <Box mt={3} p={2} bg="gray.50" borderRadius="md" maxHeight="200px" overflowY="auto">
          <Text fontSize="sm" whiteSpace="pre-wrap">
            {result}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default AIAgentNode; 