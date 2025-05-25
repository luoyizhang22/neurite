import React from 'react';
import { Box, Heading, Text, Button, Center, VStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <Box p={10}>
      <Center>
        <VStack spacing={8}>
          <Heading size="2xl">404</Heading>
          <Text fontSize="xl">页面未找到</Text>
          <Button as={Link} to="/" colorScheme="purple">
            返回首页
          </Button>
        </VStack>
      </Center>
    </Box>
  );
};

export default NotFoundPage; 