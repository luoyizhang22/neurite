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
  Collapse
} from '@chakra-ui/react';
import { 
  FiMoreHorizontal, 
  FiTrash2, 
  FiEdit2, 
  FiMaximize2,
  FiLink,
  FiExternalLink,
  FiImage,
  FiCopy
} from 'react-icons/fi';
import { INode, IImageNode } from '@types/graph';
import { useAppDispatch } from '@hooks/reduxHooks';
import { updateNode, deleteNode } from '@store/slices/nodesSlice';
import { setActiveNode } from '@store/slices/graphsSlice';

interface ImageNodeProps {
  node: INode;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (nodeId: string, multiSelect?: boolean) => void;
  onStartDrag?: (event: React.MouseEvent, nodeId: string) => void;
}

const ImageNode = ({
  node,
  isSelected,
  isActive,
  onSelect,
  onStartDrag
}: ImageNodeProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  
  // 处理图像节点特有的数据
  const imageNode = node as IImageNode;
  const imageUrl = imageNode.data?.url || '';
  const imageAlt = imageNode.data?.alt || '';
  const imageCaption = imageNode.data?.caption || '';
  
  // 状态变量
  const [isEditing, setIsEditing] = useState(false);
  const [newUrl, setNewUrl] = useState(imageUrl);
  const [newAlt, setNewAlt] = useState(imageAlt);
  const [newCaption, setNewCaption] = useState(imageCaption);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 颜色相关
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue(
    isSelected ? 'teal.500' : isActive ? 'teal.300' : 'gray.200',
    isSelected ? 'teal.500' : isActive ? 'teal.300' : 'gray.700'
  );
  const hoverBorderColor = useColorModeValue('teal.300', 'teal.300');
  
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

  // 处理图像URL更新
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUrl(e.target.value);
    setIsImageLoaded(false);
    setIsImageError(false);
  };

  // 处理图像说明文字更新
  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAlt(e.target.value);
  };

  // 处理图像说明更新
  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewCaption(e.target.value);
  };

  // 保存更改
  const handleSave = () => {
    dispatch(updateNode({
      ...node,
      data: {
        ...node.data,
        url: newUrl,
        alt: newAlt,
        caption: newCaption
      },
      updatedAt: new Date().toISOString(),
    }));
    
    setIsEditing(false);
    
    toast({
      title: '图像节点已更新',
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

  // 复制图片URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(imageUrl);
    toast({
      title: '图片链接已复制',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // 在新窗口打开图片
  const handleOpenImage = () => {
    window.open(imageUrl, '_blank');
  };

  // 切换图片缩放状态
  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
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
      setNewUrl(imageUrl);
      setNewAlt(imageAlt);
      setNewCaption(imageCaption);
      setIsEditing(false);
    }
  };

  return (
    <Box
      ref={nodeRef}
      position="absolute"
      left={`${node.position?.x || 0}px`}
      top={`${node.position?.y || 0}px`}
      width={isZoomed ? "600px" : "300px"}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow={isSelected ? 'md' : 'sm'}
      transition="all 0.2s"
      _hover={{ borderColor: hoverBorderColor }}
      zIndex={isActive || isSelected || isZoomed ? 10 : 1}
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
        bg={useColorModeValue('teal.50', 'teal.900')}
        borderTopRadius="md"
        cursor="grab"
      >
        <Flex alignItems="center">
          <FiImage color="teal" size="14px" />
          <Text fontSize="xs" fontWeight="medium" color="teal.600" ml={1}>
            图像节点
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
              编辑图像
            </MenuItem>
            <MenuItem icon={<FiMaximize2 size="1em" />} onClick={toggleZoom}>
              {isZoomed ? '缩小图像' : '放大图像'}
            </MenuItem>
            <MenuItem icon={<FiCopy size="1em" />} onClick={handleCopyUrl}>
              复制图片链接
            </MenuItem>
            <MenuItem icon={<FiExternalLink size="1em" />} onClick={handleOpenImage}>
              在新窗口打开
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
            <FormLabel fontSize="xs">图片URL</FormLabel>
            <Input
              ref={inputRef}
              size="sm"
              value={newUrl}
              onChange={handleUrlChange}
              placeholder="输入图片URL"
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel fontSize="xs">替代文本</FormLabel>
            <Input
              size="sm"
              value={newAlt}
              onChange={handleAltChange}
              placeholder="图片描述（用于无障碍访问）"
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel fontSize="xs">图片说明</FormLabel>
            <Textarea
              size="sm"
              value={newCaption}
              onChange={handleCaptionChange}
              placeholder="添加图片说明"
              rows={2}
            />
          </FormControl>
          
          <Flex justifyContent="flex-end" mt={2}>
            <Button 
              size="sm"
              variant="outline"
              mr={2}
              onClick={() => {
                setNewUrl(imageUrl);
                setNewAlt(imageAlt);
                setNewCaption(imageCaption);
                setIsEditing(false);
              }}
            >
              取消
            </Button>
            <Button 
              size="sm"
              colorScheme="teal"
              onClick={handleSave}
            >
              保存
            </Button>
          </Flex>
        </Box>
      ) : (
        <>
          {/* 图片显示区域 */}
          <Box>
            {newUrl ? (
              <AspectRatio ratio={16 / 9} maxH="300px">
                <Box position="relative">
                  <Skeleton isLoaded={isImageLoaded} w="100%" h="100%">
                    {isImageError ? (
                      <Flex 
                        justifyContent="center" 
                        alignItems="center" 
                        h="100%" 
                        bg="gray.100"
                        color="gray.500"
                        flexDirection="column"
                      >
                        <FiImage size="24px" />
                        <Text mt={2} fontSize="sm">图片加载失败</Text>
                      </Flex>
                    ) : (
                      <Image
                        src={newUrl}
                        alt={newAlt}
                        objectFit="cover"
                        w="100%"
                        h="100%"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        cursor="pointer"
                        onClick={toggleZoom}
                      />
                    )}
                  </Skeleton>
                </Box>
              </AspectRatio>
            ) : (
              <Flex 
                justifyContent="center" 
                alignItems="center" 
                h="150px" 
                bg="gray.100"
                color="gray.500"
                flexDirection="column"
              >
                <FiImage size="24px" />
                <Text mt={2} fontSize="sm">请添加图片URL</Text>
                <Button 
                  size="sm" 
                  mt={3} 
                  leftIcon={<FiEdit2 />} 
                  onClick={handleEdit}
                >
                  编辑
                </Button>
              </Flex>
            )}
          </Box>
          
          {/* 图片说明 */}
          {newCaption && (
            <Box p={3} fontSize="sm" color="gray.600">
              {newCaption}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ImageNode; 