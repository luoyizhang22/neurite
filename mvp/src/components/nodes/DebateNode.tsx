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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Radio,
  RadioGroup,
  Stack
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
  FiShield,
  FiAward,
  FiThumbsUp,
  FiThumbsDown,
  FiTrendingUp,
  FiGitBranch,
  FiDownload
} from 'react-icons/fi';
import { INode, IDebateNode } from '@types/graph';
import { useAppDispatch, useAppSelector } from '@hooks/reduxHooks';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import { setActiveNode } from '@store/slices/graphsSlice';
import { ChakraMarkdown } from '@components/shared/ChakraMarkdown';
import ReactMarkdown from 'react-markdown';

interface DebateNodeProps {
  node: INode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
}

const DebateNode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag
}: DebateNodeProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  
  // 处理辩论节点特有的数据
  const debateNode = node as IDebateNode;
  const topic = debateNode.data?.topic || '';
  const perspectives = debateNode.data?.perspectives || [];
  const analysis = debateNode.data?.analysis || '';
  const persuasiveView = debateNode.data?.persuasiveView || '';
  const debateStyle = debateNode.data?.settings?.debateStyle || 'balanced';
  const complexity = debateNode.data?.settings?.complexity || 'moderate';
  const model = debateNode.data?.settings?.model || 'gpt-4';
  
  // 状态变量
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newTopic, setNewTopic] = useState(topic);
  const [newDebateStyle, setNewDebateStyle] = useState(debateStyle);
  const [newComplexity, setNewComplexity] = useState(complexity);
  const [newModel, setNewModel] = useState(model);
  const [isLoading, setIsLoading] = useState(false);
  const [showTopic, setShowTopic] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedPerspective, setSelectedPerspective] = useState('');
  
  // 节点引用
  const nodeRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLTextAreaElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const debateBgColor = useColorModeValue('purple.50', 'purple.900');
  const borderColor = useColorModeValue(
    isSelected ? 'purple.500' : isActive ? 'purple.300' : 'gray.200',
    isSelected ? 'purple.500' : isActive ? 'purple.300' : 'gray.700'
  );
  const hoverBorderColor = useColorModeValue('purple.300', 'purple.300');
  const topicBgColor = useColorModeValue('gray.50', 'gray.700');
  
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

  // 处理话题更新
  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewTopic(e.target.value);
  };

  // 处理辩论风格更新
  const handleDebateStyleChange = (value: string) => {
    setNewDebateStyle(value);
  };

  // 处理复杂度更新
  const handleComplexityChange = (value: string) => {
    setNewComplexity(value);
  };

  // 处理模型更新
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewModel(e.target.value);
  };

  // 保存更改
  const handleSave = () => {
    if (!newTopic.trim()) {
      toast({
        title: '辩论话题不能为空',
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
        topic: newTopic,
        settings: {
          ...node.data?.settings,
          debateStyle: newDebateStyle,
          complexity: newComplexity,
          model: newModel
        }
      },
      updatedAt: new Date().toISOString(),
    }));
    
    setIsEditing(false);
    setIsSettingsOpen(false);
    
    toast({
      title: '辩论节点已更新',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 删除节点
  const handleDelete = () => {
    dispatch(deleteNode(node.id));
    
    toast({
      title: '辩论节点已删除',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // 编辑节点
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 复制分析内容
  const handleCopyAnalysis = () => {
    navigator.clipboard.writeText(analysis);
    
    toast({
      title: '思辨分析已复制',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 复制话题
  const handleCopyTopic = () => {
    navigator.clipboard.writeText(topic);
    
    toast({
      title: '辩论话题已复制',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 生成辩论观点和分析
  const handleGenerateDebate = () => {
    if (!newTopic.trim()) {
      toast({
        title: '辩论话题不能为空',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    // 模拟API调用
    setTimeout(() => {
      // 生成多个视角的观点
      const mockPerspectives = [
        {
          id: '1',
          title: '支持观点',
          content: `这是支持"${newTopic}"的观点。在实际应用中，这里将是AI生成的支持论点和论据。`,
          type: 'positive'
        },
        {
          id: '2',
          title: '反对观点',
          content: `这是反对"${newTopic}"的观点。在实际应用中，这里将是AI生成的反对论点和论据。`,
          type: 'negative'
        },
        {
          id: '3',
          title: '折中观点',
          content: `这是关于"${newTopic}"的折中观点。在实际应用中，这里将是AI生成的辩证思考和中立立场论述。`,
          type: 'neutral'
        }
      ];
      
      // 生成思辨分析
      const mockAnalysis = `## 对"${newTopic}"的多角度思辨分析

这是AI生成的对所有观点的综合分析。在实际应用中，这里将包含:

1. 各观点的主要论据和论证逻辑分析
2. 各观点的优势和局限性
3. 各观点的适用场景和条件
4. 观点之间的关联和冲突

分析风格: ${newDebateStyle}
复杂度: ${newComplexity}
使用模型: ${newModel}`;

      // 生成最具说服力的视角
      const mockPersuasiveView = `基于对所有观点的分析，"折中观点"在这个话题上最具说服力，因为它能够兼顾多方面考虑，平衡各方利益，提供更全面的解决方案。

在实际应用中，这里将是AI基于逻辑推理得出的最具说服力观点及其原因。`;
      
      dispatch(updateNode({
        ...node,
        data: {
          ...node.data,
          topic: newTopic,
          perspectives: mockPerspectives,
          analysis: mockAnalysis,
          persuasiveView: mockPersuasiveView,
          settings: {
            ...node.data?.settings,
            debateStyle: newDebateStyle,
            complexity: newComplexity,
            model: newModel
          }
        },
        updatedAt: new Date().toISOString(),
      }));
      
      setIsLoading(false);
      setIsEditing(false);
      setActiveTabIndex(1); // 自动切换到观点标签页
      
      toast({
        title: '辩论观点和分析已生成',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }, 3000);
  };

  // 重新生成辩论
  const handleRegenerateDebate = () => {
    setIsLoading(true);
    
    // 模拟API调用
    setTimeout(() => {
      // 生成新的视角观点
      const mockPerspectives = [
        {
          id: '1',
          title: '经济发展视角',
          content: `这是从经济发展角度对"${topic}"的观点。在实际应用中，这里将是AI生成的新视角论述。`,
          type: 'alternative'
        },
        {
          id: '2',
          title: '社会公平视角',
          content: `这是从社会公平角度对"${topic}"的观点。在实际应用中，这里将是AI生成的新视角论述。`,
          type: 'alternative'
        },
        {
          id: '3',
          title: '历史传统视角',
          content: `这是从历史传统角度对"${topic}"的观点。在实际应用中，这里将是AI生成的新视角论述。`,
          type: 'alternative'
        },
        {
          id: '4',
          title: '技术创新视角',
          content: `这是从技术创新角度对"${topic}"的观点。在实际应用中，这里将是AI生成的新视角论述。`,
          type: 'alternative'
        }
      ];
      
      // 生成新的思辨分析
      const mockAnalysis = `## 对"${topic}"的多角度重新思辨分析

这是AI重新生成的更深入分析。在实际应用中，这里将包含:

1. 各新视角的主要论据和论证逻辑分析
2. 视角之间的交叉影响和系统性思考
3. 不同条件下的动态平衡评估
4. 跨领域的综合思考框架

分析风格: ${debateStyle}
复杂度: ${complexity}
使用模型: ${model}`;

      // 生成新的最具说服力视角
      const mockPersuasiveView = `基于对所有视角的重新分析，"技术创新视角"在这个话题上最具说服力，因为它提供了突破性解决方案，能够解决其他视角中的核心矛盾。

在实际应用中，这里将是AI基于更全面的逻辑推理得出的最具说服力观点及其详细理由。`;
      
      dispatch(updateNode({
        ...node,
        data: {
          ...node.data,
          perspectives: mockPerspectives,
          analysis: mockAnalysis,
          persuasiveView: mockPersuasiveView,
        },
        updatedAt: new Date().toISOString(),
      }));
      
      setIsLoading(false);
      
      toast({
        title: '辩论已重新生成',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }, 3000);
  };

  // 导出分析报告
  const handleExportAnalysis = () => {
    const content = `# 辩论分析报告: ${topic}

## 话题
${topic}

## 多角度观点
${perspectives.map(p => `### ${p.title}\n${p.content}`).join('\n\n')}

## 思辨分析
${analysis}

## 最具说服力的观点
${persuasiveView}

---
生成时间: ${new Date().toLocaleString()}
模型: ${model}
辩论风格: ${debateStyle}
复杂度: ${complexity}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `辩论分析-${topic.substring(0, 20)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: '分析报告已导出',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 切换设置面板
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  // 切换话题显示
  const toggleTopicDisplay = () => {
    setShowTopic(!showTopic);
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
    if (isEditing && topicRef.current) {
      topicRef.current.focus();
    }
  }, [isEditing]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果按下Escape键，取消编辑
    if (e.key === 'Escape') {
      setNewTopic(topic);
      setNewDebateStyle(debateStyle);
      setNewComplexity(complexity);
      setNewModel(model);
      setIsEditing(false);
      setIsSettingsOpen(false);
    }
  };

  return (
    <Box
      ref={nodeRef}
      position="absolute"
      left={`${node.position?.x || 0}px`}
      top={`${node.position?.y || 0}px`}
      minWidth="320px"
      maxWidth="420px"
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
        bg={debateBgColor}
        borderTopRadius="md"
        cursor="grab"
      >
        <Flex alignItems="center">
          <Icon as={FiMessageSquare} color="purple.600" boxSize={3} />
          <Text fontSize="xs" fontWeight="medium" color="purple.600" ml={1}>
            辩论节点
          </Text>
        </Flex>
        
        {/* 模型标签 */}
        <Flex alignItems="center">
          <Tooltip label={`模型: ${model}, 风格: ${debateStyle}, 复杂度: ${complexity}`}>
            <Tag size="sm" variant="subtle" colorScheme="purple" mr={1}>
              <TagLeftIcon as={FiGitBranch} boxSize="10px" />
              <TagLabel fontSize="10px">{perspectives.length || 0}个观点</TagLabel>
            </Tag>
          </Tooltip>
          
          <Menu isLazy placement="bottom-end">
            <MenuButton
              as={IconButton}
              aria-label="节点选项"
              icon={<FiMoreHorizontal />}
              size="xs"
              variant="ghost"
              onClick={(e) => e.stopPropagation()}
            />
            <MenuList fontSize="sm" shadow="md" minWidth="140px">
              <MenuItem icon={<FiEdit2 size="1em" />} onClick={handleEdit}>
                编辑话题
              </MenuItem>
              <MenuItem icon={<FiRefreshCw size="1em" />} onClick={handleRegenerateDebate} isDisabled={!topic || perspectives.length === 0}>
                重新生成
              </MenuItem>
              <MenuItem icon={<FiSliders size="1em" />} onClick={toggleSettings}>
                辩论设置
              </MenuItem>
              <MenuItem icon={<FiCopy size="1em" />} onClick={handleCopyAnalysis} isDisabled={!analysis}>
                复制分析
              </MenuItem>
              <MenuItem icon={<FiDownload size="1em" />} onClick={handleExportAnalysis} isDisabled={!analysis}>
                导出报告
              </MenuItem>
              <MenuItem icon={<FiLink size="1em" />}>
                创建连接
              </MenuItem>
              <MenuItem 
                icon={<FiTrash2 size="1em" />} 
                color="red.500" 
                onClick={handleDelete}
              >
                删除
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* 话题区域 */}
      <Collapse in={showTopic} animateOpacity>
        <Box
          p={3}
          bg={topicBgColor}
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
        >
          <Flex 
            justifyContent="space-between" 
            alignItems="center" 
            mb={2}
            onClick={toggleTopicDisplay}
            cursor="pointer"
          >
            <Text fontSize="xs" fontWeight="medium">
              辩论话题
            </Text>
            <Tooltip label="复制话题">
              <IconButton
                aria-label="复制话题"
                icon={<FiCopy />}
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyTopic();
                }}
              />
            </Tooltip>
          </Flex>
          
          {isEditing ? (
            <Textarea
              ref={topicRef}
              value={newTopic}
              onChange={handleTopicChange}
              placeholder="输入辩论话题..."
              size="sm"
              minHeight="80px"
              resize="vertical"
              focusBorderColor="purple.400"
            />
          ) : (
            <Text 
              fontSize="sm" 
              fontWeight="medium"
              whiteSpace="pre-wrap"
              noOfLines={3}
            >
              {topic || "尚未设置辩论话题"}
            </Text>
          )}
        </Box>
      </Collapse>

      {/* 辩论设置区域 */}
      {isEditing && isSettingsOpen && (
        <Box p={3} bg="gray.50" borderBottomWidth="1px" borderBottomColor="gray.200">
          <Text fontSize="xs" fontWeight="medium" mb={3}>
            辩论设置
          </Text>
          
          <FormControl mb={3} size="sm">
            <FormLabel fontSize="xs">辩论风格</FormLabel>
            <RadioGroup onChange={handleDebateStyleChange} value={newDebateStyle}>
              <Stack direction="column" spacing={2}>
                <Radio size="sm" value="balanced">均衡分析</Radio>
                <Radio size="sm" value="adversarial">对抗式辩论</Radio>
                <Radio size="sm" value="socratic">苏格拉底式</Radio>
                <Radio size="sm" value="exploratory">探索式思考</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
          
          <FormControl mb={3} size="sm">
            <FormLabel fontSize="xs">复杂度</FormLabel>
            <RadioGroup onChange={handleComplexityChange} value={newComplexity}>
              <Stack direction="column" spacing={2}>
                <Radio size="sm" value="simple">简单 - 基础论点</Radio>
                <Radio size="sm" value="moderate">中等 - 深入分析</Radio>
                <Radio size="sm" value="complex">复杂 - 专业水平</Radio>
                <Radio size="sm" value="expert">专家 - 学术深度</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
          
          <FormControl size="sm">
            <FormLabel fontSize="xs">AI模型</FormLabel>
            <Select 
              size="xs" 
              value={newModel}
              onChange={handleModelChange}
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* 辩论内容区域 */}
      <Box>
        {/* 加载中状态 */}
        {isLoading ? (
          <Flex 
            height="150px" 
            alignItems="center" 
            justifyContent="center" 
            direction="column"
            p={4}
          >
            <Spinner size="md" color="purple.500" mb={2} />
            <Text fontSize="sm" color="gray.500">
              正在生成多角度观点和分析...
            </Text>
          </Flex>
        ) : perspectives.length > 0 ? (
          <Box p={0}>
            <Tabs 
              variant="soft-rounded" 
              colorScheme="purple" 
              size="sm" 
              index={activeTabIndex}
              onChange={setActiveTabIndex}
              p={2}
            >
              <TabList>
                <Tab fontSize="xs">概览</Tab>
                <Tab fontSize="xs">观点({perspectives.length})</Tab>
                <Tab fontSize="xs">分析</Tab>
              </TabList>
              
              <TabPanels>
                {/* 概览标签页 */}
                <TabPanel p={2}>
                  <Text fontSize="xs" fontWeight="bold" mb={2}>辩论摘要</Text>
                  <Text fontSize="sm" mb={3}>
                    {topic}的多角度分析，包含{perspectives.length}个不同观点。
                  </Text>
                  
                  <Flex justifyContent="space-between" alignItems="center">
                    <Badge colorScheme="purple" mb={1}>
                      最具说服力
                    </Badge>
                  </Flex>
                  
                  <Box 
                    p={2} 
                    bg="purple.50" 
                    borderRadius="md" 
                    borderLeft="3px solid" 
                    borderColor="purple.300"
                    fontSize="sm"
                  >
                    {persuasiveView || "尚未生成分析结论"}
                  </Box>
                </TabPanel>
                
                {/* 观点标签页 */}
                <TabPanel p={2}>
                  <RadioGroup onChange={setSelectedPerspective} value={selectedPerspective}>
                    <Accordion allowToggle defaultIndex={[0]}>
                      {perspectives.map((perspective, index) => (
                        <AccordionItem key={perspective.id} mb={2}>
                          <h2>
                            <AccordionButton 
                              px={2} 
                              py={1}
                              bg={useColorModeValue('gray.50', 'gray.700')}
                              borderRadius="md"
                              _expanded={{ 
                                bg: perspective.type === 'positive' 
                                  ? 'green.50' 
                                  : perspective.type === 'negative'
                                  ? 'red.50'
                                  : 'blue.50',
                                color: perspective.type === 'positive'
                                  ? 'green.700'
                                  : perspective.type === 'negative'
                                  ? 'red.700'
                                  : 'blue.700'
                              }}
                            >
                              <Radio 
                                value={perspective.id} 
                                size="sm" 
                                name="perspective" 
                                onClick={(e) => e.stopPropagation()}
                                mr={2}
                              />
                              <Box flex='1' textAlign='left' fontSize="sm">
                                <Flex alignItems="center">
                                  {perspective.type === 'positive' && <Icon as={FiThumbsUp} boxSize={3} mr={1} color="green.500" />}
                                  {perspective.type === 'negative' && <Icon as={FiThumbsDown} boxSize={3} mr={1} color="red.500" />}
                                  {perspective.type === 'neutral' && <Icon as={FiShield} boxSize={3} mr={1} color="blue.500" />}
                                  {perspective.type === 'alternative' && <Icon as={FiTrendingUp} boxSize={3} mr={1} color="purple.500" />}
                                  {perspective.title}
                                </Flex>
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4} fontSize="sm">
                            {perspective.content}
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </RadioGroup>
                </TabPanel>
                
                {/* 分析标签页 */}
                <TabPanel p={2}>
                  {analysis ? (
                    <ChakraMarkdown>
                      <ReactMarkdown>
                        {analysis}
                      </ReactMarkdown>
                    </ChakraMarkdown>
                  ) : (
                    <Flex 
                      height="80px" 
                      alignItems="center" 
                      justifyContent="center" 
                      direction="column"
                    >
                      <Icon as={FiAlertCircle} boxSize={5} color="gray.400" mb={2} />
                      <Text fontSize="sm" color="gray.500" textAlign="center">
                        尚未生成分析
                      </Text>
                    </Flex>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        ) : (
          <Flex 
            height="100px" 
            alignItems="center" 
            justifyContent="center" 
            direction="column"
            p={4}
          >
            <Icon as={FiMessageSquare} boxSize={5} color="gray.300" mb={2} />
            <Text fontSize="sm" color="gray.500" textAlign="center">
              请输入辩论话题并开始生成多角度观点
            </Text>
          </Flex>
        )}
        
        {/* 编辑模式下的按钮 */}
        {isEditing && (
          <Flex justifyContent="space-between" p={3} borderTopWidth="1px" borderTopColor="gray.200">
            <Button 
              size="xs"
              leftIcon={<FiSliders />}
              onClick={toggleSettings}
            >
              {isSettingsOpen ? '隐藏设置' : '显示设置'}
            </Button>
            
            <Flex>
              <Button 
                size="xs"
                variant="outline"
                mr={2}
                onClick={() => {
                  setNewTopic(topic);
                  setNewDebateStyle(debateStyle);
                  setNewComplexity(complexity);
                  setNewModel(model);
                  setIsEditing(false);
                  setIsSettingsOpen(false);
                }}
              >
                取消
              </Button>
              <Button 
                size="xs"
                colorScheme="purple"
                leftIcon={<FiSend />}
                onClick={handleGenerateDebate}
                isLoading={isLoading}
              >
                开始辩论
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
      
      {/* 底部区域 */}
      {!isEditing && (
        <Flex 
          px={3} 
          py={1} 
          borderTopWidth="1px" 
          borderTopColor="gray.200"
          bg={useColorModeValue('gray.50', 'gray.700')}
          borderBottomRadius="md"
          fontSize="xs"
          color="gray.500"
          justifyContent="space-between"
          alignItems="center"
        >
          <Flex alignItems="center">
            <Icon as={FiClock} boxSize={3} mr={1} />
            <Text>
              {new Date(node.metadata?.updatedAt || new Date()).toLocaleString()}
            </Text>
          </Flex>
          
          {!isLoading && perspectives.length > 0 && (
            <Flex>
              {analysis && (
                <Tooltip label="导出分析报告">
                  <IconButton
                    aria-label="导出报告"
                    icon={<FiDownload />}
                    size="xs"
                    variant="ghost"
                    mr={1}
                    onClick={handleExportAnalysis}
                  />
                </Tooltip>
              )}
              <Tooltip label="重新生成辩论">
                <IconButton
                  aria-label="重新生成"
                  icon={<FiRefreshCw />}
                  size="xs"
                  variant="ghost"
                  onClick={handleRegenerateDebate}
                />
              </Tooltip>
            </Flex>
          )}
        </Flex>
      )}
    </Box>
  );
};

export default DebateNode; 