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
  Link,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FiMoreHorizontal, 
  FiTrash2, 
  FiEdit2, 
  FiMaximize2,
  FiLink,
  FiCopy,
  FiExternalLink,
  FiArrowLeft
} from 'react-icons/fi';
import { INode, IAnswerNode } from '@types/graph';
import { useAppDispatch, useAppSelector } from '@hooks/reduxHooks';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import { setActiveNode } from '@store/slices/graphsSlice';
import ReactMarkdown from 'react-markdown';

interface AnswerNodeProps {
  node: INode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
}

const AnswerNode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag
}: AnswerNodeProps) => {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(state => state.nodes.nodes);
  
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(node.content || '');
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const answerBgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue(
    isSelected ? 'blue.500' : isActive ? 'blue.300' : 'gray.200',
    isSelected ? 'blue.500' : isActive ? 'blue.300' : 'gray.700'
  );
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.400');
  
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
    setContent(e.target.value);
  };

  // 保存更改
  const handleSave = () => {
    if (content !== node.content) {
      dispatch(updateNode({
        ...node,
        content,
        updatedAt: new Date().toISOString(),
      }));
    }
    setIsEditing(false);
  };

  // 删除节点
  const handleDelete = () => {
    dispatch(deleteNode(node.id));
  };

  // 编辑节点
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 复制节点内容
  const handleCopy = () => {
    navigator.clipboard.writeText(node.content || '');
  };

  // 获取关联的问题节点
  const getQuestionNode = () => {
    const answerNode = node as IAnswerNode;
    const questionNodeId = answerNode.data?.questionNodeId;
    return questionNodeId ? nodes[questionNodeId] : null;
  };

  // 跳转到问题节点
  const goToQuestionNode = () => {
    const questionNode = getQuestionNode();
    if (questionNode) {
      dispatch(setActiveNode(questionNode.id));
    }
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

  // 当进入编辑模式时，聚焦并设置光标到末尾
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  // 处理Esc键取消编辑，Enter+Shift保存编辑
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(node.content || '');
      setIsEditing(false);
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // 获取关联的问题节点
  const questionNode = getQuestionNode();

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
        bg={answerBgColor}
        borderTopRadius="md"
        cursor="grab"
      >
        <Flex alignItems="center">
          <Text fontSize="xs" fontWeight="medium" color="blue.600">
            回答节点
          </Text>
        </Flex>
        
        {/* 节点菜单 */}
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
              编辑回答
            </MenuItem>
            <MenuItem icon={<FiCopy size="1em" />} onClick={handleCopy}>
              复制内容
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

      {/* 相关问题 */}
      {questionNode && !isEditing && (
        <Flex 
          p={2} 
          bg={useColorModeValue('gray.50', 'gray.700')}
          fontSize="xs"
          color="gray.600"
          alignItems="center"
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
        >
          <FiArrowLeft size="12px" />
          <Text ml={1}>回答问题:</Text>
          <Link
            ml={1}
            fontWeight="medium"
            color="blue.500"
            onClick={goToQuestionNode}
            _hover={{ textDecoration: 'underline' }}
            noOfLines={1}
            flex="1"
          >
            {questionNode.content?.substring(0, 40) || '未命名问题'}
            {questionNode.content?.length > 40 ? '...' : ''}
          </Link>
        </Flex>
      )}

      {/* 节点内容 */}
      <Box p={3}>
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder="输入回答内容..."
            minHeight="120px"
            width="100%"
            resize="vertical"
            border="none"
            _focus={{ boxShadow: 'none' }}
            autoFocus
          />
        ) : (
          <Box 
            fontSize="sm" 
            whiteSpace="pre-wrap" 
            onClick={() => dispatch(setActiveNode(node.id))}
          >
            {node.content ? (
              <ReactMarkdown>
                {node.content}
              </ReactMarkdown>
            ) : (
              <Text color="gray.400" fontStyle="italic">
                请输入回答内容...
              </Text>
            )}
          </Box>
        )}
      </Box>

      {/* 来源引用 */}
      {!isEditing && (
        <Box
          borderTopWidth="1px"
          borderTopColor="gray.200"
          p={2}
          fontSize="xs"
          color="gray.500"
        >
          <Flex justifyContent="space-between" alignItems="center">
            <Text>由用户创建</Text>
            <Text>{new Date(node.metadata?.updatedAt).toLocaleDateString()}</Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default AnswerNode; 