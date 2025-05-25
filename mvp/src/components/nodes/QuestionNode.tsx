import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  Textarea,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useOutsideClick,
  Badge,
  Button,
  Collapse,
  List,
  ListItem,
  Avatar,
  Tooltip,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  ListIcon,
  Icon
} from '@chakra-ui/react';
import { 
  FiMoreHorizontal, 
  FiTrash2, 
  FiEdit2, 
  FiMaximize2,
  FiLink,
  FiCopy,
  FiHelpCircle,
  FiMessageCircle,
  FiPlus,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import { INode, IQuestionNode } from '@types/graph';
import { useAppDispatch, useAppSelector } from '@hooks/reduxHooks';
import { updateNode, deleteNode, createNode } from '@store/slices/nodesSlice';
import { setActiveNode, selectNodeIds } from '@store/slices/graphsSlice';
import ReactMarkdown from 'react-markdown';
import { nanoid } from 'nanoid';
import { ChakraMarkdown } from '@components/shared/ChakraMarkdown';

interface QuestionNodeProps {
  node: INode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
}

const QuestionNode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag
}: QuestionNodeProps) => {
  const dispatch = useAppDispatch();
  const selectedNodeIds = useAppSelector(selectNodeIds);
  const nodes = useAppSelector(state => state.nodes.nodes);
  const toast = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newContent, setNewContent] = useState(node.content || '');
  const [isAnswersOpen, setIsAnswersOpen] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const questionBgColor = useColorModeValue('purple.50', 'purple.900');
  const borderColor = useColorModeValue(
    isSelected ? 'purple.500' : isActive ? 'purple.300' : 'gray.200',
    isSelected ? 'purple.500' : isActive ? 'purple.300' : 'gray.700'
  );
  const badgeBgColor = useColorModeValue('purple.100', 'purple.700');
  const hoverBorderColor = useColorModeValue('purple.300', 'purple.300');
  
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

  // 处理内容更新
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewContent(e.target.value);
  };

  // 保存更改
  const handleSave = () => {
    if (!newContent.trim()) {
      toast({
        title: '问题内容不能为空',
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
        content: newContent,
      },
      updatedAt: new Date().toISOString(),
    }));
    
    setIsEditing(false);
    
    toast({
      title: '问题节点已更新',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 删除节点
  const handleDelete = () => {
    dispatch(deleteNode(node.id));
    
    toast({
      title: '问题节点已删除',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // 编辑节点
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 复制内容
  const handleCopy = () => {
    navigator.clipboard.writeText(node.content || '');
    
    toast({
      title: '问题内容已复制',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 创建新答案节点
  const handleCreateAnswer = () => {
    // 计算新节点位置（在问题节点右下方）
    const x = (node.position?.x || 0) + 300;
    const y = (node.position?.y || 0) + 100;
    
    // 创建新的答案节点
    const newAnswerNode = {
      type: 'answer',
      position: { x, y },
      data: {
        content: '',
        format: 'markdown',
        questionNodeId: node.id,
        sourceNodeIds: []
      },
      connectedTo: [node.id],
    };
    
    // 分发创建节点动作
    dispatch(createNode(newAnswerNode))
      .then((action) => {
        if (action.payload) {
          const newNodeId = action.payload.id;
          
          // 更新问题节点，添加对新答案的引用
          const updatedAnswerNodeIds = [...(node.data?.answerNodeIds || []), newNodeId];
          dispatch(updateNode({
            ...node,
            data: {
              ...node.data,
              answerNodeIds: updatedAnswerNodeIds
            },
            connectedTo: [...(node.connectedTo || []), newNodeId],
            updatedAt: new Date().toISOString(),
          }));
          
          // 设置活动节点为新创建的答案节点
          dispatch(setActiveNode(newNodeId));
          
          toast({
            title: '已创建新答案节点',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        }
      });
  };

  // 使用AI创建答案
  const handleAIAnswer = () => {
    toast({
      title: 'AI生成答案功能即将推出',
      description: '我们正在努力开发这项功能',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // 添加到搜索
  const handleAddToSearch = () => {
    toast({
      title: '已添加到搜索队列',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 转到关联答案节点
  const handleGoToAnswer = (answerId: string) => {
    dispatch(setActiveNode(answerId));
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
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果按下Escape键，取消编辑
    if (e.key === 'Escape') {
      setNewContent(node.content || '');
      setIsEditing(false);
    }
    
    // 如果按下Shift+Enter，保存编辑
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // 获取关联的答案节点
  const answerNodes = nodes.filter(n => (node.data?.answerNodeIds || []).includes(n.id));

  // 切换答案列表的显示/隐藏
  const toggleAnswers = () => {
    setIsAnswersOpen(!isAnswersOpen);
  };

  // 跳转到答案节点
  const goToAnswerNode = (answerId: string) => {
    dispatch(setActiveNode(answerId));
  };

  return (
    <Box
      ref={nodeRef}
      position="absolute"
      left={`${node.position?.x || 0}px`}
      top={`${node.position?.y || 0}px`}
      minWidth="250px"
      maxWidth="400px"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow={isSelected ? 'md' : 'sm'}
      transition="all 0.2s"
      _hover={{ borderColor: hoverBorderColor }}
      zIndex={isActive || isSelected ? 2 : 1}
      onMouseDown={handleClick}
      onClick={(e) => e.stopPropagation()}
      onMouseDownCapture={handleDragStart}
      onKeyDown={handleKeyDown}
      cursor={isEditing ? 'text' : 'pointer'}
    >
      {/* 节点标题栏 */}
      <Flex
        px={3}
        py={1}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        justifyContent="space-between"
        alignItems="center"
        bg={questionBgColor}
        borderTopRadius="md"
        cursor="grab"
      >
        <Flex alignItems="center">
          <FiHelpCircle color="purple" size="14px" />
          <Text fontSize="xs" fontWeight="medium" color="purple.600" ml={1}>
            问题节点
          </Text>
          <Badge size="sm" ml={2} bg={badgeBgColor} color="purple.600">
            {answerNodes.length} 回答
          </Badge>
        </Flex>
        
        {/* 节点菜单 */}
        <Flex alignItems="center">
          {answerNodes.length > 0 && (
            <Popover trigger="hover" placement="top">
              <PopoverTrigger>
                <Badge 
                  colorScheme="purple" 
                  variant="subtle" 
                  borderRadius="full" 
                  mr={1}
                  fontSize="xs"
                  cursor="pointer"
                  onClick={toggleAnswers}
                >
                  {answerNodes.length} 个答案
                </Badge>
              </PopoverTrigger>
              <PopoverContent width="200px">
                <PopoverArrow />
                <PopoverBody p={2}>
                  <Text fontSize="xs" fontWeight="medium" mb={1}>
                    已关联的答案
                  </Text>
                  <List spacing={1}>
                    {answerNodes.map((answer, index) => (
                      <ListItem 
                        key={answer.id} 
                        fontSize="xs"
                        p={1}
                        borderRadius="sm"
                        _hover={{ bg: 'gray.100' }}
                        cursor="pointer"
                        onClick={() => handleGoToAnswer(answer.id)}
                      >
                        <Flex alignItems="center">
                          <ListIcon as={FiMessageCircle} color="purple.500" />
                          <Text noOfLines={1}>
                            答案 {index + 1}: {answer.data?.content.substring(0, 20)}
                            {answer.data?.content.length > 20 ? '...' : ''}
                          </Text>
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
          
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
                编辑问题
              </MenuItem>
              <MenuItem icon={<FiPlus size="1em" />} onClick={handleCreateAnswer}>
                添加答案
              </MenuItem>
              <MenuItem icon={<FiMessageCircle size="1em" />} onClick={handleAIAnswer}>
                AI生成答案
              </MenuItem>
              <MenuItem icon={<FiPlus size="1em" />} onClick={handleAddToSearch}>
                添加到搜索
              </MenuItem>
              <MenuItem icon={<FiCopy size="1em" />} onClick={handleCopy}>
                复制问题
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

      {/* 节点内容 */}
      <Box p={3} bg={questionBgColor}>
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={newContent}
            onChange={handleContentChange}
            placeholder="输入问题内容..."
            minHeight="80px"
            width="100%"
            resize="vertical"
            border="none"
            _focus={{ boxShadow: 'none' }}
            autoFocus
          />
        ) : (
          <Box 
            fontSize="sm" 
            fontWeight="medium"
            whiteSpace="pre-wrap" 
            onClick={() => dispatch(setActiveNode(node.id))}
          >
            {node.content ? (
              <ChakraMarkdown>
                <ReactMarkdown>
                  {node.content}
                </ReactMarkdown>
              </ChakraMarkdown>
            ) : (
              <Text color="gray.400" fontStyle="italic">
                请输入问题...
              </Text>
            )}
          </Box>
        )}
      </Box>

      {/* 回答区域 */}
      {!isEditing && (
        <Collapse in={isAnswersOpen} animateOpacity>
          <Box p={3} pt={0} borderTopWidth={answerNodes.length > 0 ? "1px" : 0} borderTopColor="gray.200">
            {answerNodes.length > 0 ? (
              <List spacing={2} mt={2}>
                {answerNodes.map((answerNode) => (
                  <ListItem key={answerNode.id} 
                    p={2} 
                    borderRadius="md" 
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                    cursor="pointer"
                    onClick={() => goToAnswerNode(answerNode.id)}
                  >
                    <Flex>
                      <Avatar size="xs" bg="blue.300" mr={2} />
                      <Box flex="1">
                        <Text fontSize="xs" noOfLines={2} color="gray.600">
                          {answerNode.data?.content || '空回答'}
                        </Text>
                      </Box>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={2}>
                <Text fontSize="xs" color="gray.500">没有回答</Text>
                <Button 
                  size="xs" 
                  leftIcon={<FiPlus />} 
                  colorScheme="purple" 
                  variant="outline"
                  mt={2}
                  onClick={handleCreateAnswer}
                >
                  添加回答
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      )}

      {/* 回答操作按钮 */}
      {!isEditing && !isAnswersOpen && answerNodes.length > 0 && (
        <Flex p={2} borderTopWidth="1px" borderTopColor="gray.200" justifyContent="center">
          <Button 
            size="xs" 
            leftIcon={<FiMessageCircle />} 
            variant="ghost" 
            onClick={toggleAnswers}
          >
            查看 {answerNodes.length} 个回答
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default QuestionNode; 