import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  Center,
  Container,
  Flex,
  Image,
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const HomePage = () => {
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={10}>
        {/* 欢迎部分 */}
        <Center flexDirection="column" textAlign="center" mb={10}>
          <Heading size="2xl" mb={4}>
            Neurite Storm
          </Heading>
          <Text fontSize="xl" maxW="800px" mb={6}>
            可视化思维导图与知识管理工具 - 组织你的想法，连接你的思维
          </Text>
          <Button
            as={RouterLink}
            to="/graph/new"
            colorScheme="purple"
            size="lg"
          >
            创建新思维图谱
          </Button>
        </Center>

        {/* 示例图谱部分 */}
        <Box mt={12}>
          <Heading size="lg" mb={6}>
            最近打开
          </Heading>
          <Flex wrap="wrap" gap={6} justifyContent="center">
            {[1, 2, 3].map((i) => (
              <Box 
                key={i}
                as={RouterLink}
                to={`/graph/${i}`}
                p={5}
                w="300px"
                borderWidth="1px"
                borderRadius="lg"
                _hover={{ 
                  transform: 'translateY(-5px)', 
                  boxShadow: 'xl',
                  borderColor: 'purple.300'
                }}
                transition="all 0.3s"
              >
                <Heading size="md" mb={2}>
                  示例图谱 {i}
                </Heading>
                <Text mb={4} color="gray.600">
                  这是一个示例图谱描述，您可以点击查看详情。
                </Text>
                <Text fontSize="sm" color="gray.500">
                  最后编辑: {new Date().toLocaleDateString()}
                </Text>
              </Box>
            ))}
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage; 