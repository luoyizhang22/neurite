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
  Tooltip,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { 
  FiMoreHorizontal, 
  FiTrash2, 
  FiEdit2, 
  FiMaximize2,
  FiLink,
  FiCopy,
  FiCpu
} from 'react-icons/fi';
import { INode, IPort, IPortNode } from '@types/graph';
import { useAppDispatch } from '@hooks/reduxHooks';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import ReactMarkdown from 'react-markdown';

interface PortNodeProps {
  node: IPortNode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
  onStartConnection?: (portId: string, nodeId: string, isInput: boolean) => void;
}

const PortNode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag,
  onStartConnection
}: PortNodeProps) => {
  const dispatch = useAppDispatch();
  const [showFullContent, setShowFullContent] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue(
    isSelected ? 'teal.500' : isActive ? 'teal.300' : 'gray.200',
    isSelected ? 'teal.500' : isActive ? 'teal.500' : 'gray.700'
  );
  const hoverBorderColor = useColorModeValue('teal.300', 'teal.300');
  const inputPortColor = useColorModeValue('blue.400', 'blue.300');
  const outputPortColor = useColorModeValue('green.400', 'green.300');
  
  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    // 选择节点，如果按住Ctrl/Cmd则多选
    onSelect(node.id, e.ctrlKey || e.metaKey);
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    if (onStartDrag) {
      onStartDrag(e, node.id);
    }
  };

  // 删除节点
  const handleDelete = () => {
    dispatch(deleteNode(node.id));
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
  const handleStartPortConnection = (e: React.MouseEvent, port: IPort) => {
    e.stopPropagation();
    if (onStartConnection) {
      onStartConnection(port.id, node.id, port.direction === 'input');
    }
  };

  // 渲染端口
  const renderPort = (port: IPort, isInput: boolean) => {
    const portColor = isInput ? inputPortColor : outputPortColor;
    const portPosition = isInput ? 'left' : 'right';
    
    return (
      <Tooltip key={port.id} label={`${port.name} (${port.type})`} placement={isInput ? 'left' : 'right'}>
        <Box
          position="absolute"
          left={isInput ? '-8px' : 'auto'}
          right={!isInput ? '-8px' : 'auto'}
          top={`${isInput ? 60 + node.data.inputs.indexOf(port) * 30 : 60 + node.data.outputs.indexOf(port) * 30}px`}
          width="16px"
          height="16px"
          borderRadius="full"
          bg={portColor}
          border="2px solid white"
          boxShadow="sm"
          cursor="crosshair"
          zIndex={3}
          _hover={{ transform: 'scale(1.2)', boxShadow: 'md' }}
          onClick={(e) => handleStartPortConnection(e, port)}
        />
      </Tooltip>
    );
  };

  // 计算节点显示内容
  const displayContent = showFullContent 
    ? node.data.content 
    : (node.data.content.length > 150 ? node.data.content.substring(0, 150) + '...' : node.data.content);

  return (
    <Box
      ref={nodeRef}
      position="absolute"
      left={`${node.position?.x || 0}px`}
      top={`${node.position?.y || 0}px`}
      minWidth="300px"
      maxWidth={showFullContent ? "600px" : "400px"}
      bg={bgColor}
      borderWidth="2px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow={isSelected ? 'md' : 'sm'}
      transition="all 0.2s"
      _hover={{ borderColor: hoverBorderColor }}
      zIndex={isActive || isSelected ? 2 : 1}
      onMouseDown={handleClick}
      onClick={(e) => e.stopPropagation()}
      onMouseDownCapture={handleDragStart}
      cursor="pointer"
    >
      {/* 节点标题栏 */}
      <Flex
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        justifyContent="space-between"
        alignItems="center"
        bg={useColorModeValue('teal.50', 'gray.900')}
        borderTopRadius="md"
        cursor="grab"
      >
        <Flex align="center">
          <FiCpu color={useColorModeValue('teal.500', 'teal.300')} style={{ marginRight: '8px' }} />
          <Heading size="xs" fontWeight="semibold">
            {node.data.title || '端口节点'}
          </Heading>
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
            <MenuItem icon={<FiEdit2 size="1em" />}>
              编辑配置
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
              icon={<FiTrash2 size="1em" />} 
              color="red.500" 
              onClick={handleDelete}
            >
              删除
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      {/* 节点内容 */}
      <Box p={3} minHeight="100px">
        {/* 节点描述 */}
        <Text fontSize="sm" color="gray.600" mb={2}>
          {node.data.description || '无描述'}
        </Text>
        
        {/* 显示处理逻辑 */}
        <Box 
          p={2} 
          bg={useColorModeValue('gray.50', 'gray.700')} 
          borderRadius="md" 
          fontSize="sm"
          mb={3}
        >
          <Text fontWeight="medium" fontSize="xs" mb={1} color="gray.500">处理逻辑:</Text>
          <Text fontSize="xs" fontFamily="monospace">
            {node.data.process || '无处理逻辑'}
          </Text>
        </Box>
        
        {/* 输入输出标签 */}
        <Flex justify="space-between" mt={2} mb={1}>
          <Badge colorScheme="blue" variant="subtle">
            输入: {node.data.inputs.length}
          </Badge>
          <Badge colorScheme="green" variant="subtle">
            输出: {node.data.outputs.length}
          </Badge>
        </Flex>
        
        {/* 节点主要内容 */}
        <Box 
          mt={3} 
          fontSize="sm"
          maxHeight={showFullContent ? 'none' : '200px'}
          overflowY="auto"
        >
          {node.data.format === 'markdown' ? (
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          ) : (
            <Text whiteSpace="pre-wrap">{displayContent}</Text>
          )}
        </Box>
      </Box>

      {/* 输入端口 */}
      {node.data.inputs.map(port => renderPort(port, true))}
      
      {/* 输出端口 */}
      {node.data.outputs.map(port => renderPort(port, false))}
    </Box>
  );
};

export default PortNode; 