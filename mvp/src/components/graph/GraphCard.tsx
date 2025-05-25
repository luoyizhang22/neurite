import { useState } from 'react';
import {
  Box,
  Text,
  Flex,
  Image,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Badge,
  Tooltip,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiMoreVertical, FiTrash2, FiEdit2, FiCopy, FiShare2 } from 'react-icons/fi';
import { useAppDispatch } from '@hooks/reduxHooks';
import { toggleStarredGraph, deleteGraph } from '@store/slices/graphsSlice';
import { IGraph } from '@types/graph';
import { useRef } from 'react';

interface GraphCardProps {
  graph: IGraph;
  onClick?: (graphId: string) => void;
}

const GraphCard = ({ graph, onClick }: GraphCardProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // 颜色模式
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');

  // 缩略图
  const thumbnailUrl = graph.thumbnail || '/images/default-graph-thumbnail.png';

  // 处理点击卡片
  const handleCardClick = () => {
    if (onClick) {
      onClick(graph.id);
    } else {
      navigate(`/graph/${graph.id}`);
    }
  };

  // 切换收藏状态
  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleStarredGraph(graph.id));
  };

  // 处理删除图谱
  const handleDeleteGraph = async () => {
    try {
      await dispatch(deleteGraph(graph.id)).unwrap();
      onClose();
    } catch (error) {
      console.error('删除图谱失败', error);
    }
  };

  // 编辑图谱属性
  const handleEditGraph = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/graph/${graph.id}/settings`);
  };

  // 复制图谱
  const handleDuplicateGraph = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: 实现复制图谱的功能
    console.log('复制图谱', graph.id);
  };

  // 分享图谱
  const handleShareGraph = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: 实现分享图谱的功能
    console.log('分享图谱', graph.id);
  };

  // 格式化更新时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        borderColor={cardBorderColor}
        overflow="hidden"
        bg={cardBg}
        transition="all 0.2s"
        _hover={{ 
          transform: 'translateY(-2px)', 
          shadow: 'md', 
          borderColor: 'purple.300',
          bg: cardHoverBg
        }}
        cursor="pointer"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        position="relative"
        h="100%"
        display="flex"
        flexDirection="column"
      >
        {/* 缩略图 */}
        <Box position="relative" h="140px" overflow="hidden">
          <Image
            src={thumbnailUrl}
            alt={graph.title}
            w="100%"
            h="100%"
            objectFit="cover"
            fallbackSrc="https://via.placeholder.com/300x140?text=思维图谱"
          />
          
          {/* 收藏按钮 */}
          <IconButton
            aria-label="收藏图谱"
            icon={<Icon as={FiStar} color={graph.starred ? 'yellow.400' : 'gray.300'} />}
            size="sm"
            position="absolute"
            top={2}
            left={2}
            onClick={handleToggleStar}
            bg={graph.starred ? 'yellow.400' : 'whiteAlpha.800'}
            color={graph.starred ? 'white' : 'gray.600'}
            _hover={{ bg: graph.starred ? 'yellow.500' : 'gray.200' }}
            opacity={isHovering || graph.starred ? 1 : 0.7}
            transition="all 0.2s"
          />
          
          {/* 菜单按钮 */}
          <Box
            position="absolute"
            top={2}
            right={2}
            opacity={isHovering ? 1 : 0}
            transition="all 0.2s"
          >
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="图谱选项"
                icon={<FiMoreVertical />}
                size="sm"
                variant="ghost"
                bg="whiteAlpha.800"
                _hover={{ bg: 'whiteAlpha.900' }}
              />
              <MenuList fontSize="sm">
                <MenuItem icon={<Icon as={FiEdit2} />} onClick={handleEditGraph}>
                  编辑属性
                </MenuItem>
                <MenuItem icon={<Icon as={FiCopy} />} onClick={handleDuplicateGraph}>
                  复制
                </MenuItem>
                <MenuItem icon={<Icon as={FiShare2} />} onClick={handleShareGraph}>
                  分享
                </MenuItem>
                <MenuItem icon={<Icon as={FiTrash2} color="red.500" />} onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}>
                  删除
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </Box>

        {/* 内容 */}
        <Flex direction="column" p={3} flex="1">
          <Text fontWeight="semibold" fontSize="md" noOfLines={1} mb={1}>
            {graph.title}
          </Text>
          
          <Text fontSize="sm" color="gray.500" noOfLines={2} mb={2} flex="1">
            {graph.description || "无描述"}
          </Text>
          
          {/* 元数据 */}
          <Flex justifyContent="space-between" alignItems="center" mt="auto">
            <Flex alignItems="center">
              <Tooltip label={`${graph.nodes?.length || 0} 个节点`}>
                <Badge colorScheme="purple" mr={2}>
                  {graph.nodes?.length || 0}节点
                </Badge>
              </Tooltip>
              
              {graph.isShared && (
                <Tooltip label="已分享">
                  <Badge colorScheme="blue">已分享</Badge>
                </Tooltip>
              )}
            </Flex>
            
            <Text fontSize="xs" color="gray.500">
              {formatDate(graph.updatedAt)}
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* 删除确认对话框 */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              删除图谱
            </AlertDialogHeader>

            <AlertDialogBody>
              确定要删除 "{graph.title}" 吗？此操作无法撤销。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                取消
              </Button>
              <Button colorScheme="red" onClick={handleDeleteGraph} ml={3}>
                删除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default GraphCard; 