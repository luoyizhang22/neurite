import React from 'react';
import { Box, Text, Button } from '@chakra-ui/react';

const TestComponent = () => {
  return (
    <Box p={5} bg="white" borderRadius="md" shadow="md">
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        测试组件已成功渲染
      </Text>
      <Button colorScheme="purple">
        测试按钮
      </Button>
    </Box>
  );
};

export default TestComponent; 