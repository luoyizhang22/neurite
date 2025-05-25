import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Heading,
  Text,
  Icon,
  Button,
  List,
  ListItem,
  Divider,
  Flex,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiHome,
  FiBrain,
  FiStar,
  FiClipboard,
  FiSearch,
  FiPlus,
  FiChevronRight,
} from 'react-icons/fi';
import { useAppSelector } from '@hooks/reduxHooks';

interface SidebarProps {
  width: number;
  isDrawer?: boolean;
  onResize: (width: number) => void;
}

const Sidebar = ({ width, isDrawer = false, onResize }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const { recentGraphs } = useAppSelector((state) => state.graphs);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const activeBgColor = useColorModeValue('purple.50', 'purple.900');
  const activeColor = useColorModeValue('purple.700', 'purple.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: '首页', icon: FiHome, path: '/' },
    { name: '我的图谱', icon: FiBrain, path: '/graphs' },
    { name: '收藏', icon: FiStar, path: '/starred' },
    { name: '模板', icon: FiClipboard, path: '/templates' },
  ];

  // 调整侧边栏宽度的功能(未实现具体拖拽功能，仅预留接口)
  const handleResizeMouseDown = () => {
    // 实际上应该添加拖拽调整功能
  };

  return (
    <Box h="100%" overflowY="auto" p={4}>
      {/* 搜索框 */}
      <InputGroup mb={6}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="搜索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          bg={useColorModeValue('gray.50', 'gray.700')}
          border="1px"
          borderColor={borderColor}
        />
      </InputGroup>

      {/* 导航菜单 */}
      <List spacing={2} mb={6}>
        {navItems.map((item) => (
          <ListItem key={item.path}>
            <Button
              w="100%"
              justifyContent="flex-start"
              variant="ghost"
              leftIcon={<Icon as={item.icon} boxSize={5} />}
              bg={isActive(item.path) ? activeBgColor : 'transparent'}
              color={isActive(item.path) ? activeColor : undefined}
              borderRadius="md"
              onClick={() => navigate(item.path)}
              py={3}
              _hover={{ bg: hoverBgColor }}
            >
              {item.name}
            </Button>
          </ListItem>
        ))}
      </List>

      {/* 创建新图谱按钮 */}
      <Button
        leftIcon={<FiPlus />}
        colorScheme="purple"
        w="100%"
        mb={6}
        onClick={() => navigate('/new-graph')}
      >
        创建新图谱
      </Button>

      <Divider mb={6} />

      {/* 最近图谱列表 */}
      <Box mb={6}>
        <Heading size="sm" mb={3}>
          最近访问
        </Heading>
        <List spacing={1}>
          {recentGraphs.slice(0, 5).map((graph) => (
            <ListItem key={graph.id}>
              <Button
                w="100%"
                justifyContent="flex-start"
                variant="ghost"
                leftIcon={<Icon as={FiBrain} boxSize={4} />}
                rightIcon={<Icon as={FiChevronRight} boxSize={4} />}
                fontSize="sm"
                onClick={() => navigate(`/graph/${graph.id}`)}
                py={2}
                _hover={{ bg: hoverBgColor }}
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {graph.title}
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* 侧边栏调整手柄，仅在非抽屉模式下显示 */}
      {!isDrawer && (
        <Box
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          width="4px"
          cursor="ew-resize"
          onMouseDown={handleResizeMouseDown}
          _hover={{ bg: 'purple.500' }}
        />
      )}
    </Box>
  );
};

export default Sidebar; 