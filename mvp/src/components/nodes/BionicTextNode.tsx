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
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
  FormLabel,
  Switch,
} from '@chakra-ui/react';
import { 
  FiMoreHorizontal, 
  FiTrash2, 
  FiEdit2, 
  FiMaximize2,
  FiLink,
  FiCopy,
  FiEye
} from 'react-icons/fi';
import { INode, ITextNode } from '@types/graph';
import { useAppDispatch } from '@hooks/reduxHooks';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import BionicReader from '@components/common/BionicReader';

interface BionicTextNodeProps {
  node: ITextNode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
  onStartConnection?: (nodeId: string) => void;
}

const BionicTextNode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag,
  onStartConnection
}: BionicTextNodeProps) => {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(node.data.content || '');
  const [showFullContent, setShowFullContent] = useState(false);
  const [highlightRatio, setHighlightRatio] = useState(0.4);
  const [showHighlightControls, setShowHighlightControls] = useState(false);
  const [useColumns, setUseColumns] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue(
    isSelected ? 'blue.500' : isActive ? 'blue.300' : 'gray.200',
    isSelected ? 'blue.500' : isActive ? 'blue.500' : 'gray.700'
  );
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.300');
  
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
    if (content !== node.data.content) {
      dispatch(updateNode({
        ...node,
        data: {
          ...node.data,
          content,
          format: 'bionic',
        },
        metadata: {
          ...node.metadata,
          updatedAt: new Date(),
        }
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
    navigator.clipboard.writeText(node.data.content || '');
  };

  // 最大化/恢复节点
  const toggleFullContent = () => {
    setShowFullContent(!showFullContent);
  };

  // 处理开始创建连接
  const handleStartConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartConnection) {
      onStartConnection(node.id);
    }
  };

  // 切换高亮控件显示
  const toggleHighlightControls = () => {
    setShowHighlightControls(!showHighlightControls);
  };

  // 更新高亮比例
  const updateHighlightRatio = (value: number) => {
    setHighlightRatio(value);
  };

  // 切换分栏显示
  const toggleColumns = () => {
    setUseColumns(!useColumns);
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
      setContent(node.data.content || '');
      setIsEditing(false);
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // 计算节点显示内容
  const displayContent = showFullContent 
    ? content 
    : (content.length > 300 ? content.substring(0, 300) + '...' : content);

  return (
    <Box
      ref={nodeRef}
      position="absolute"
      left={`${node.position?.x || 0}px`}
      top={`${node.position?.y || 0}px`}
      minWidth="250px"
      maxWidth={showFullContent ? "700px" : "400px"}
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
        bg={useColorModeValue('blue.50', 'blue.900')}
        borderTopRadius="md"
        cursor="grab"
      >
        <Flex align="center">
          <FiEye size="12px" style={{ marginRight: '6px' }} />
          <Text fontSize="xs" fontWeight="medium" color="blue.500">
            仿生阅读
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
              编辑内容
            </MenuItem>
            <MenuItem 
              icon={<FiEye size="1em" />} 
              onClick={toggleHighlightControls}
            >
              {showHighlightControls ? '隐藏阅读设置' : '阅读设置'}
            </MenuItem>
            <MenuItem 
              icon={<FiMaximize2 size="1em" />} 
              onClick={toggleFullContent}
            >
              {showFullContent ? '恢复大小' : '展开'}
            </MenuItem>
            <MenuItem icon={<FiCopy size="1em" />} onClick={handleCopy}>
              复制内容
            </MenuItem>
            <MenuItem 
              icon={<FiLink size="1em" />} 
              onClick={handleStartConnection}
            >
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

      {/* 仿生阅读设置 */}
      {showHighlightControls && !isEditing && (
        <Box px={3} py={2} borderBottomWidth="1px" borderBottomColor="gray.100">
          <Flex align="center" mb={1}>
            <Text fontSize="xs" mr={2}>高亮强度:</Text>
            <Slider
              value={highlightRatio}
              min={0.1}
              max={0.7}
              step={0.05}
              onChange={updateHighlightRatio}
              size="sm"
              flex="1"
              colorScheme="blue"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={3} />
            </Slider>
          </Flex>
          <Flex align="center" mt={1}>
            <FormLabel htmlFor="columns-switch" mb="0" fontSize="xs">
              分栏显示:
            </FormLabel>
            <Switch 
              id="columns-switch" 
              size="sm" 
              colorScheme="blue"
              isChecked={useColumns}
              onChange={toggleColumns}
            />
          </Flex>
        </Box>
      )}

      {/* 节点内容 */}
      <Box p={3} maxHeight={showFullContent ? 'none' : '400px'} overflow="auto">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            minHeight="150px"
            resize="vertical"
            border="none"
            _focus={{ border: 'none', boxShadow: 'none' }}
            placeholder="输入文本内容..."
          />
        ) : (
          <BionicReader 
            text={node.data.content || displayContent} 
            highlightRatio={highlightRatio}
            layout={useColumns ? 'columns' : 'paragraph'}
            columnCount={2}
            fontSize="sm"
          />
        )}
      </Box>
    </Box>
  );
};

export default BionicTextNode; 