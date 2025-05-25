import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Navbar from '../components/shared/Navbar';

const MainLayout = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Flex h="100vh" flexDirection="column">
      <Navbar />
      <Box
        as="main"
        flex="1"
        h="100%"
        overflow="auto"
        bg={bgColor}
      >
        <Outlet />
      </Box>
    </Flex>
  );
};

export default MainLayout; 