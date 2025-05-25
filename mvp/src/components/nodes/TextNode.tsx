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
  Select,
  HStack,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FiMoreHorizontal, 
  FiTrash2, 
  FiEdit2, 
  FiMaximize2,
  FiLink,
  FiCopy,
  FiCpu,
  FiMessageSquare,
  FiExternalLink
} from 'react-icons/fi';
import { INode } from '@types/graph';
import { useAppDispatch, useAppSelector } from '@hooks/reduxHooks';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import { setActiveNode, selectNodeIds } from '@store/slices/graphsSlice';
import ReactMarkdown from 'react-markdown';
import aiService from '@api/aiService';

interface TextNodeProps {
  node: INode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
  onStartConnection?: (nodeId: string) => void;
  onChangeNodeType?: (nodeId: string, newType: string) => void;
}

const TextNode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag,
  onStartConnection,
  onChangeNodeType
}: TextNodeProps) => {
  const dispatch = useAppDispatch();
  const selectedNodeIds = useAppSelector(selectNodeIds);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(node.content || '');
  const [showFullContent, setShowFullContent] = useState(false);
  const [nodeType, setNodeType] = useState(node.type);
  
  // 根据用户选择更新节点类型
  const handleNodeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setNodeType(newType);
    
    if (onChangeNodeType) {
      onChangeNodeType(node.id, newType);
    } else {
      // 默认实现 - 保存当前内容并更改节点类型
      let updateData: any = {};
      
      if (newType === 'text') {
        updateData = {
          content: content,
          format: 'plain',
        };
      } else if (newType === 'ai') {
        updateData = {
          prompt: content,
          response: '',
        };
      } else if (newType === 'question') {
        updateData = {
          content: content,
          format: 'plain',
          answerNodeIds: [],
        };
      }
      
      dispatch(updateNode({
        id: node.id,
        type: newType as any,
        data: updateData,
      }));
    }
  };
  
  // 输入框引用
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue(
    isSelected ? 'blue.500' : isActive ? 'blue.300' : 'gray.200',
    isSelected ? 'blue.500' : isActive ? 'blue.300' : 'gray.700'
  );
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.300');
  
  // 向AI发送查询
  const sendToAI = async () => {
    // 根据不同的节点类型设置不同的提示词模板
    let prompt = content;
    if (node.type === 'text') {
      prompt = `我有一段文本内容: "${content}"\n\n请分析这段内容并提供见解。`;
    } else if (node.type === 'question') {
      prompt = `问题: "${content}"\n\n请提供详细的回答。`;
    }
    
    try {
      // 创建AI节点，内容为当前节点内容
      const aiNodeData = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        position: { 
          x: (node.position?.x || 0) + 350, 
          y: (node.position?.y || 0) 
        },
        data: {
          prompt: prompt,
          response: '',
          contextNodes: [node.id],
        },
        connectedTo: [node.id],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
      };
      
      dispatch(updateNode({
        id: node.id,
        connectedTo: [...(node.connectedTo || []), aiNodeData.id]
      }));
      
      // 在Redux中创建新节点
      dispatch(updateNode(aiNodeData));
      
    } catch (error) {
      console.error('Error creating AI node:', error);
    }
  };

  // 在组件挂载或者node更新时更新content状态
  useEffect(() => {
    setContent(node.content || '');
  }, [node.content]);

  // 在编辑模式下自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
    }
  }, [isEditing]);
  
  // 点击外部区域关闭编辑模式
  useOutsideClick({
    ref: nodeRef,
    handler: () => {
      if (isEditing) {
        handleSave();
      }
    },
  });

  // 点击节点的处理函数
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 如果按住了Shift键，则是多选
    if (e.shiftKey) {
      onSelect(node.id, true);
    } else {
      onSelect(node.id);
    }
    
    // 设置激活节点（最后点击的节点）
    dispatch(setActiveNode(node.id));
  };

  // 处理节点拖动开始
  const handleDragStart = (e: React.MouseEvent) => {
    if (onStartDrag) {
      onStartDrag(e, node.id);
    }
  };

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // 保存更改
  const handleSave = () => {
    dispatch(updateNode({
      id: node.id,
      data: {
        ...node.data,
        content: content,
      },
    }));
    setIsEditing(false);
  };

  // 删除节点
  const handleDelete = () => {
    dispatch(deleteNode(node.id));
  };

  // 进入编辑模式
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 复制内容
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  // 切换显示全部内容
  const toggleFullContent = () => {
    setShowFullContent(!showFullContent);
  };

  // 启动连接
  const handleStartConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onStartConnection) {
      onStartConnection(node.id);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 按ESC取消编辑
    if (e.key === 'Escape') {
      setContent(node.content || '');
      setIsEditing(false);
    }
    
    // 按Ctrl+Enter保存
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <Box
      ref={nodeRef}
      position="absolute"
      left={`${node.position?.x || 0}px`}
      top={`${node.position?.y || 0}px`}
      width="320px"
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
    >
      <Flex
        px={3}
        py={1}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        justifyContent="space-between"
        alignItems="center"
        cursor="grab"
      >
        <HStack spacing={2}>
          <Text fontSize="xs" fontWeight="medium" color={textColor}>
            {node.type === 'text' ? '文本节点' : 
             node.type === 'ai' ? 'AI节点' : 
             node.type === 'question' ? '问题节点' : 
             node.type === 'answer' ? '回答节点' : 
             node.type === 'link' ? '链接节点' : '节点'}
          </Text>
          
          {/* 增加节点类型选择器 */}
          <Select
            size="xs"
            value={nodeType}
            onChange={handleNodeTypeChange}
            width="100px"
            variant="filled"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="text">文本</option>
            <option value="ai">AI</option>
            <option value="question">问题</option>
            <option value="answer">回答</option>
            <option value="link">链接</option>
          </Select>
        </HStack>
        
        <Flex>
          <Tooltip label="向AI提问">
            <IconButton
              aria-label="向AI提问"
              icon={<FiCpu />}
              size="xs"
              variant="ghost"
              onClick={sendToAI}
            />
          </Tooltip>
          
          <Tooltip label="创建连接">
            <IconButton
              aria-label="创建连接"
              icon={<FiLink />}
              size="xs"
              variant="ghost"
              onClick={handleStartConnection}
            />
          </Tooltip>
          
          <Menu isLazy placement="bottom-end">
            <MenuButton
              as={IconButton}
              icon={<FiMoreHorizontal />}
              size="xs"
              variant="ghost"
            />
            <MenuList fontSize="sm">
              <MenuItem icon={<FiEdit2 />} onClick={handleEdit}>
                编辑
              </MenuItem>
              <MenuItem icon={<FiCopy />} onClick={handleCopy}>
                复制内容
              </MenuItem>
              <MenuItem icon={<FiMaximize2 />} onClick={toggleFullContent}>
                {showFullContent ? '简洁视图' : '展开全部'}
              </MenuItem>
              <MenuItem icon={<FiTrash2 />} onClick={handleDelete} color="red.400">
                删除
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Box p={3}>
        {isEditing ? (
          <Textarea
            ref={inputRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="输入节点内容..."
            size="sm"
            minHeight="100px"
            autoFocus
          />
        ) : (
          <Box
            maxHeight={showFullContent ? 'none' : '150px'}
            overflow={showFullContent ? 'visible' : 'hidden'}
            position="relative"
            onClick={handleEdit}
            cursor="text"
          >
            {node.data?.format === 'markdown' ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <Text whiteSpace="pre-wrap">{content}</Text>
            )}
            
            {!showFullContent && content.length > 150 && (
              <Box
                position="absolute"
                bottom="0"
                left="0"
                right="0"
                height="30px"
                bgGradient="linear(to-t, whiteAlpha.900, transparent)"
                pointerEvents="none"
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TextNode; 