import React from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Button, 
  HStack, 
  useColorMode, 
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiMoon, FiSun, FiSettings } from 'react-icons/fi';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      as="nav" 
      py={3} 
      px={5} 
      bg={bgColor} 
      borderBottom="1px" 
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
        <Heading 
          as={RouterLink} 
          to="/" 
          size="md" 
          color="purple.500"
          _hover={{ textDecoration: 'none' }}
        >
          Neurite Storm
        </Heading>
        
        <HStack spacing={4}>
          <Button 
            as={RouterLink} 
            to="/" 
            variant="ghost" 
            colorScheme="purple"
          >
            首页
          </Button>
          
          <IconButton
            aria-label="切换颜色模式"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            variant="ghost"
          />
          
          <IconButton
            as={RouterLink}
            to="/settings"
            aria-label="设置"
            icon={<FiSettings />}
            variant="ghost"
          />
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar; 