import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Select,
  Text,
  useToast,
  Box,
  SimpleGrid,
  Flex,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiLayout, FiFileText, FiHelpCircle, FiCode } from 'react-icons/fi';
import { useAppDispatch } from '@hooks/reduxHooks';
import { createGraph } from '@store/slices/graphsSlice';
import { useNavigate } from 'react-router-dom';

interface CreateGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const CreateGraphModal = ({ isOpen, onClose }: CreateGraphModalProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectedBg = useColorModeValue('purple.50', 'purple.900');
  const selectedBorder = useColorModeValue('purple.500', 'purple.500');

  // 模板选项
  const templates: TemplateOption[] = [
    {
      id: 'blank',
      name: '空白图谱',
      description: '从零开始创建一个全新的思维图谱',
      icon: FiLayout,
    },
    {
      id: 'notes',
      name: '笔记模板',
      description: '适合学习笔记和知识整理',
      icon: FiFileText,
    },
    {
      id: 'question',
      name: '问题探究',
      description: '以问题为中心进行思考和探究',
      icon: FiHelpCircle,
    },
    {
      id: 'code',
      name: '编程项目',
      description: '适合规划和设计编程项目',
      icon: FiCode,
    },
  ];

  // 处理创建图谱
  const handleCreateGraph = async () => {
    if (!title.trim()) {
      toast({
        title: '请输入标题',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // 创建图谱
      const newGraph = await dispatch(
        createGraph({
          title: title.trim(),
          description: description.trim(),
          template: selectedTemplate,
        })
      ).unwrap();

      // 关闭弹窗
      onClose();

      // 提示成功
      toast({
        title: '图谱创建成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // 导航到新创建的图谱
      navigate(`/graph/${newGraph.id}`);
    } catch (error) {
      toast({
        title: '创建失败',
        description: '图谱创建过程中发生错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>创建新思维图谱</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* 基本信息 */}
            <Box>
              <FormControl isRequired mb={4}>
                <FormLabel htmlFor="title">标题</FormLabel>
                <Input
                  id="title"
                  placeholder="输入图谱标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>

              <FormControl mb={4}>
                <FormLabel htmlFor="description">描述</FormLabel>
                <Textarea
                  id="description"
                  placeholder="输入图谱描述（可选）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </FormControl>
            </Box>

            {/* 模板选择 */}
            <Box>
              <Text fontWeight="medium" mb={2}>
                选择模板
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {templates.map((template) => (
                  <Box
                    key={template.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={
                      selectedTemplate === template.id ? selectedBorder : borderColor
                    }
                    bg={selectedTemplate === template.id ? selectedBg : bgColor}
                    cursor="pointer"
                    onClick={() => setSelectedTemplate(template.id)}
                    transition="all 0.2s"
                    _hover={{ borderColor: 'purple.400' }}
                  >
                    <Flex alignItems="center">
                      <Icon
                        as={template.icon}
                        boxSize={5}
                        color="purple.500"
                        mr={3}
                      />
                      <Box>
                        <Text fontWeight="medium">{template.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {template.description}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            取消
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleCreateGraph}
            isLoading={isLoading}
            loadingText="创建中"
          >
            创建
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateGraphModal; 