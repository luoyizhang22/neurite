import {
  Box,
  Flex,
  IconButton,
  Button,
  useColorModeValue,
  useColorMode,
  Heading,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Image,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FiMenu, FiMoon, FiSun, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      py={2}
      zIndex="docked"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          {/* 移动端菜单按钮 */}
          <IconButton
            aria-label="打开菜单"
            icon={<FiMenu />}
            size="md"
            variant="ghost"
            display={{ base: 'flex', md: 'none' }}
            onClick={onMenuClick}
          />
          
          {/* 应用标志和名称 */}
          <Link to="/">
            <HStack>
              <Image
                src="/images/logo.svg"
                alt="Neurite Storm Logo"
                fallbackSrc="https://via.placeholder.com/40x40/6B46C1/FFFFFF?text=NS"
                boxSize="40px"
              />
              <Heading size="md" display={{ base: 'none', md: 'block' }}>
                Neurite Storm
              </Heading>
            </HStack>
          </Link>
        </HStack>

        <HStack spacing={4}>
          {/* 深色模式切换 */}
          <IconButton
            aria-label={colorMode === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            variant="ghost"
          />

          {/* 用户菜单 */}
          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="link"
              cursor="pointer"
              minW={0}
            >
              <Avatar size="sm" name="用户" />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>我的账户</MenuItem>
              <MenuItem icon={<FiSettings />} as={Link} to="/settings">
                设置
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />}>退出登录</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header; 