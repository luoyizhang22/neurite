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
  Image,
  Input,
  Textarea,
  Button,
  FormControl,
  FormLabel,
  Skeleton,
  useToast,
  AspectRatio,
  Heading,
  Link as ChakraLink,
  Icon
} from '@chakra-ui/react';
import { 
  FiMoreHorizontal, 
  FiTrash2, 
  FiEdit2, 
  FiMaximize2,
  FiLink,
  FiExternalLink,
  FiCopy,
  FiGlobe
} from 'react-icons/fi';
import { INode, ILinkNode } from '@types/graph';
import { useAppDispatch } from '@hooks/reduxHooks';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import { setActiveNode } from '@store/slices/graphsSlice';

interface LinkNodeProps {
  node: INode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
}

const LinkNode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag
}: LinkNodeProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  
  // 处理链接节点特有的数据
  const linkNode = node as ILinkNode;
  const url = linkNode.data?.url || '';
  const title = linkNode.data?.title || '未命名链接';
  const description = linkNode.data?.description || '';
  const thumbnail = linkNode.data?.thumbnail || '';
  
  // 状态变量
  const [isEditing, setIsEditing] = useState(false);
  const [newUrl, setNewUrl] = useState(url);
  const [newTitle, setNewTitle] = useState(title);
  const [newDescription, setNewDescription] = useState(description);
  const [newThumbnail, setNewThumbnail] = useState(thumbnail);
  const [isImageLoaded, setIsImageLoaded] = useState(!!thumbnail);
  const [isImageError, setIsImageError] = useState(false);
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const linkBgColor = useColorModeValue('green.50', 'green.900');
  const borderColor = useColorModeValue(
    isSelected ? 'green.500' : isActive ? 'green.300' : 'gray.200',
    isSelected ? 'green.500' : isActive ? 'green.300' : 'gray.700'
  );
  const hoverBorderColor = useColorModeValue('green.300', 'green.300');
  
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

  // 处理URL更新
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUrl(e.target.value);
  };

  // 处理标题更新
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  // 处理描述更新
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewDescription(e.target.value);
  };

  // 处理缩略图更新
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewThumbnail(e.target.value);
    setIsImageLoaded(false);
    setIsImageError(false);
  };

  // 保存更改
  const handleSave = () => {
    if (!newUrl) {
      toast({
        title: 'URL不能为空',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // 如果URL没有协议前缀，添加http://
    let processedUrl = newUrl;
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = 'http://' + processedUrl;
    }

    dispatch(updateNode({
      ...node,
      data: {
        ...node.data,
        url: processedUrl,
        title: newTitle || '未命名链接',
        description: newDescription,
        thumbnail: newThumbnail
      },
      updatedAt: new Date().toISOString(),
    }));
    
    setIsEditing(false);
    setNewUrl(processedUrl);
    
    toast({
      title: '链接节点已更新',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 删除节点
  const handleDelete = () => {
    dispatch(deleteNode(node.id));
  };

  // 编辑节点
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 复制链接
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: '链接已复制',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 打开链接
  const handleOpenLink = () => {
    window.open(url, '_blank');
  };

  // 处理图片加载完成
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setIsImageError(false);
  };

  // 处理图片加载错误
  const handleImageError = () => {
    setIsImageLoaded(true);
    setIsImageError(true);
  };

  // 格式化URL以用于显示
  const formatUrlForDisplay = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
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

  // 当进入编辑模式时，聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // 处理Esc键取消编辑
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setNewUrl(url);
      setNewTitle(title);
      setNewDescription(description);
      setNewThumbnail(thumbnail);
      setIsEditing(false);
    }
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
        bg={linkBgColor}
        borderTopRadius="md"
        cursor="grab"
      >
        <Flex alignItems="center">
          <Icon as={FiLink} color="green.600" boxSize={3} />
          <Text fontSize="xs" fontWeight="medium" color="green.600" ml={1}>
            链接节点
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
              编辑链接
            </MenuItem>
            <MenuItem icon={<FiExternalLink size="1em" />} onClick={handleOpenLink}>
              打开链接
            </MenuItem>
            <MenuItem icon={<FiCopy size="1em" />} onClick={handleCopyUrl}>
              复制链接
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

      {/* 编辑表单 */}
      {isEditing ? (
        <Box p={3}>
          <FormControl mb={3}>
            <FormLabel fontSize="xs">URL</FormLabel>
            <Input
              ref={inputRef}
              size="sm"
              value={newUrl}
              onChange={handleUrlChange}
              placeholder="输入URL，例如: https://example.com"
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel fontSize="xs">标题</FormLabel>
            <Input
              size="sm"
              value={newTitle}
              onChange={handleTitleChange}
              placeholder="链接标题"
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel fontSize="xs">描述</FormLabel>
            <Textarea
              size="sm"
              value={newDescription}
              onChange={handleDescriptionChange}
              placeholder="添加描述"
              rows={2}
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel fontSize="xs">缩略图URL</FormLabel>
            <Input
              size="sm"
              value={newThumbnail}
              onChange={handleThumbnailChange}
              placeholder="缩略图URL（可选）"
            />
          </FormControl>
          
          <Flex justifyContent="flex-end" mt={2}>
            <Button 
              size="sm"
              variant="outline"
              mr={2}
              onClick={() => {
                setNewUrl(url);
                setNewTitle(title);
                setNewDescription(description);
                setNewThumbnail(thumbnail);
                setIsEditing(false);
              }}
            >
              取消
            </Button>
            <Button 
              size="sm"
              colorScheme="green"
              onClick={handleSave}
            >
              保存
            </Button>
          </Flex>
        </Box>
      ) : (
        <Box 
          p={3} 
          cursor="pointer" 
          onClick={handleOpenLink} 
          _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
        >
          {/* 链接内容 */}
          <Flex direction={thumbnail ? "row" : "column"}>
            {/* 缩略图（如果有） */}
            {thumbnail && (
              <Box flexShrink={0} width="100px" mr={3}>
                <AspectRatio ratio={1} w="100px" h="100px">
                  <Skeleton isLoaded={isImageLoaded} width="100%" height="100%">
                    {isImageError ? (
                      <Flex 
                        bg="gray.100" 
                        alignItems="center" 
                        justifyContent="center"
                        borderRadius="md"
                      >
                        <Icon as={FiGlobe} boxSize={6} color="gray.400" />
                      </Flex>
                    ) : (
                      <Image
                        src={thumbnail}
                        alt={title}
                        objectFit="cover"
                        borderRadius="md"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    )}
                  </Skeleton>
                </AspectRatio>
              </Box>
            )}
            
            {/* 链接信息 */}
            <Box flex="1">
              <Heading size="sm" noOfLines={2} mb={1}>
                {title}
              </Heading>
              
              {description && (
                <Text fontSize="sm" color="gray.600" noOfLines={2} mb={2}>
                  {description}
                </Text>
              )}
              
              <Flex align="center" mt={1}>
                <Icon as={FiGlobe} boxSize={3} color="green.500" />
                <Text fontSize="xs" color="green.500" ml={1} fontWeight="medium">
                  {formatUrlForDisplay(url)}
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default LinkNode; 