import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Collapse,
  HStack,
  Button,
  Input,
  VStack,
  Badge,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Tooltip,
  Heading
} from '@chakra-ui/react';
import {
  FiChevronRight,
  FiChevronDown,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
  FiLink,
  FiMessageSquare,
  FiActivity,
  FiCpu,
  FiFilter,
  FiInfo
} from 'react-icons/fi';
import { IKnowledgeTree, IKnowledgeBranch } from '@types/graph';

interface KnowledgeTreeProps {
  initialTree?: IKnowledgeTree;
  onCreateNode?: (branchId: string, nodeType: string) => void;
  onBranchSelect?: (branchId: string) => void;
}

// 知识分类
const KNOWLEDGE_CATEGORIES = [
  { id: 'history', name: '历史', color: 'orange' },
  { id: 'natural_science', name: '自然科学', color: 'green' },
  { id: 'human_science', name: '人文科学', color: 'blue' },
  { id: 'philosophy', name: '哲学', color: 'purple' },
  { id: 'arts', name: '艺术', color: 'pink' }
];

// 达朗贝尔知识树组件
const KnowledgeTree: React.FC<KnowledgeTreeProps> = ({
  initialTree,
  onCreateNode,
  onBranchSelect
}) => {
  // 状态
  const [tree, setTree] = useState<IKnowledgeTree>(initialTree || {
    id: 'tree1',
    name: '知识树',
    root: {
      id: 'branch1',
      name: '知识分类',
      category: 'philosophy',
      description: '基于达朗贝尔分类法的知识组织',
      children: [
        {
          id: 'branch2',
          name: '历史',
          category: 'history',
          description: '关于过去事件和发展的记录和研究',
          children: [],
          collapsed: false
        },
        {
          id: 'branch3',
          name: '自然科学',
          category: 'natural_science',
          description: '研究自然现象和物质世界的知识领域',
          children: [
            {
              id: 'branch4',
              name: '物理学',
              category: 'natural_science',
              description: '研究物质、能量与自然规律的学科',
              children: [],
              collapsed: true
            },
            {
              id: 'branch5',
              name: '生物学',
              category: 'natural_science',
              description: '研究生命与生物有机体的学科',
              children: [],
              collapsed: true
            }
          ],
          collapsed: false
        },
        {
          id: 'branch6',
          name: '哲学',
          category: 'philosophy',
          description: '研究知识、现实、存在、价值、理性和语言等根本问题的学科',
          children: [],
          collapsed: true
        }
      ],
      collapsed: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // 新分支模态框
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDescription, setNewBranchDescription] = useState('');
  const [newBranchCategory, setNewBranchCategory] = useState('philosophy');
  const [parentBranchId, setParentBranchId] = useState('');
  
  // 颜色
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const selectedBgColor = useColorModeValue('blue.50', 'blue.900');
  
  // 分支是否匹配搜索和分类过滤器
  const branchMatchesFilters = (branch: IKnowledgeBranch): boolean => {
    const matchesSearch = !searchFilter || 
      branch.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      branch.description.toLowerCase().includes(searchFilter.toLowerCase());
      
    const matchesCategory = !categoryFilter || branch.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  };
  
  // 递归渲染分支
  const renderBranch = (branch: IKnowledgeBranch, level: number = 0): JSX.Element => {
    const isSelected = branch.id === selectedBranchId;
    const categoryInfo = KNOWLEDGE_CATEGORIES.find(c => c.id === branch.category);
    const showBranch = branchMatchesFilters(branch);
    
    // 如果分支不匹配过滤器但子分支有匹配的，仍然显示
    const hasMatchingChildren = Array.isArray(branch.children) && 
      branch.children.some(child => 
        typeof child === 'object' && branchMatchesFilters(child as IKnowledgeBranch)
      );
    
    if (!showBranch && !hasMatchingChildren) {
      return <></>;
    }
    
    return (
      <Box key={branch.id} ml={level * 4} mb={2}>
        <Flex
          p={2}
          borderRadius="md"
          align="center"
          bg={isSelected ? selectedBgColor : bgColor}
          borderWidth="1px"
          borderColor={isSelected ? 'blue.300' : borderColor}
          _hover={{ bg: isSelected ? selectedBgColor : hoverBgColor }}
          onClick={() => {
            setSelectedBranchId(branch.id);
            if (onBranchSelect) onBranchSelect(branch.id);
          }}
          cursor="pointer"
        >
          {/* 展开/折叠按钮 */}
          {Array.isArray(branch.children) && branch.children.length > 0 && (
            <IconButton
              aria-label={branch.collapsed ? '展开' : '折叠'}
              icon={branch.collapsed ? <FiChevronRight /> : <FiChevronDown />}
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                toggleBranchCollapse(branch.id);
              }}
              mr={2}
            />
          )}
          
          {/* 分支名称和分类 */}
          <VStack align="flex-start" spacing={0} flex="1">
            <Text fontWeight={isSelected ? 'bold' : 'medium'}>{branch.name}</Text>
            <HStack spacing={2}>
              {categoryInfo && (
                <Badge colorScheme={categoryInfo.color} size="sm">
                  {categoryInfo.name}
                </Badge>
              )}
              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                {branch.description}
              </Text>
            </HStack>
          </VStack>
          
          {/* 分支操作菜单 */}
          <Menu isLazy>
            <MenuButton
              as={IconButton}
              aria-label="分支操作"
              icon={<FiPlus />}
              size="xs"
              variant="ghost"
              onClick={(e) => e.stopPropagation()}
            />
            <MenuList fontSize="sm">
              <MenuItem 
                icon={<FiPlus />} 
                onClick={(e) => {
                  e.stopPropagation();
                  setParentBranchId(branch.id);
                  onOpen();
                }}
              >
                添加子分类
              </MenuItem>
              <MenuItem icon={<FiEdit2 />}>编辑分类</MenuItem>
              <Divider my={1} />
              <MenuItem 
                icon={<FiBookOpen />} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCreateNode) onCreateNode(branch.id, 'text');
                }}
              >
                添加文本节点
              </MenuItem>
              <MenuItem 
                icon={<FiMessageSquare />} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCreateNode) onCreateNode(branch.id, 'ai');
                }}
              >
                添加AI节点
              </MenuItem>
              <MenuItem 
                icon={<FiActivity />} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCreateNode) onCreateNode(branch.id, 'debate');
                }}
              >
                添加辩论节点
              </MenuItem>
              <MenuItem 
                icon={<FiCpu />} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCreateNode) onCreateNode(branch.id, 'port');
                }}
              >
                添加处理模块
              </MenuItem>
              <Divider my={1} />
              <MenuItem 
                icon={<FiTrash2 />} 
                color="red.500"
                isDisabled={branch.id === tree.root.id}
              >
                删除分类
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        
        {/* 子分支 */}
        {Array.isArray(branch.children) && branch.children.length > 0 && (
          <Collapse in={!branch.collapsed}>
            <Box pl={2} borderLeftWidth="1px" borderColor="gray.200" ml={2} mt={1}>
              {branch.children.map((child) => {
                if (typeof child === 'object') {
                  return renderBranch(child as IKnowledgeBranch, level + 1);
                }
                return null;
              })}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };
  
  // 切换分支展开/折叠状态
  const toggleBranchCollapse = (branchId: string) => {
    // 创建树的深拷贝
    const newTree = JSON.parse(JSON.stringify(tree)) as IKnowledgeTree;
    
    // 递归查找并更新分支
    const updateBranch = (branch: IKnowledgeBranch): boolean => {
      if (branch.id === branchId) {
        branch.collapsed = !branch.collapsed;
        return true;
      }
      
      if (Array.isArray(branch.children)) {
        for (const child of branch.children) {
          if (typeof child === 'object' && updateBranch(child as IKnowledgeBranch)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    updateBranch(newTree.root);
    setTree(newTree);
  };
  
  // 添加新分支
  const addNewBranch = () => {
    if (!newBranchName.trim()) return;
    
    // 创建树的深拷贝
    const newTree = JSON.parse(JSON.stringify(tree)) as IKnowledgeTree;
    
    // 新分支对象
    const newBranch: IKnowledgeBranch = {
      id: `branch-${Date.now()}`,
      name: newBranchName.trim(),
      description: newBranchDescription.trim() || `${newBranchName.trim()}分类`,
      category: newBranchCategory as any,
      children: [],
      parentId: parentBranchId,
      collapsed: false
    };
    
    // 递归查找父分支并添加新分支
    const updateParentBranch = (branch: IKnowledgeBranch): boolean => {
      if (branch.id === parentBranchId) {
        if (!Array.isArray(branch.children)) {
          branch.children = [];
        }
        branch.children.push(newBranch);
        branch.collapsed = false; // 展开父分支
        return true;
      }
      
      if (Array.isArray(branch.children)) {
        for (const child of branch.children) {
          if (typeof child === 'object' && updateParentBranch(child as IKnowledgeBranch)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    updateParentBranch(newTree.root);
    newTree.updatedAt = new Date();
    
    setTree(newTree);
    
    // 重置表单
    setNewBranchName('');
    setNewBranchDescription('');
    onClose();
  };
  
  return (
    <Box p={4} borderRadius="md" shadow="md" bg={bgColor} maxH="800px" overflow="auto">
      {/* 知识树顶部操作区 */}
      <Flex justify="space-between" align="center" mb={4}>
        <Flex align="center">
          <Heading size="md" mr={2}>{tree.name}</Heading>
          <Tooltip label="基于达朗贝尔百科全书的知识分类法，帮助构建有序的知识体系">
            <IconButton
              aria-label="知识树信息"
              icon={<FiInfo />}
              size="xs"
              variant="ghost"
            />
          </Tooltip>
        </Flex>
        
        <HStack>
          <Button 
            leftIcon={<FiPlus />} 
            size="sm" 
            colorScheme="blue" 
            variant="outline"
            onClick={() => {
              setParentBranchId(tree.root.id);
              onOpen();
            }}
          >
            添加分类
          </Button>
        </HStack>
      </Flex>
      
      {/* 过滤器 */}
      <Flex mb={4} gap={2}>
        <Input 
          placeholder="搜索分类..." 
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          size="sm"
          flex="1"
        />
        <Select 
          placeholder="所有分类" 
          size="sm" 
          width="140px"
          value={categoryFilter || ''}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
        >
          {KNOWLEDGE_CATEGORIES.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <IconButton
          aria-label="清除过滤器"
          icon={<FiFilter />}
          size="sm"
          onClick={() => {
            setSearchFilter('');
            setCategoryFilter(null);
          }}
        />
      </Flex>
      
      {/* 知识树内容 */}
      <Box mt={2}>
        {renderBranch(tree.root)}
      </Box>
      
      {/* 添加分支模态框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>添加知识分类</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>分类名称</FormLabel>
              <Input 
                value={newBranchName} 
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="输入分类名称"
              />
            </FormControl>
            
            <FormControl mb={3}>
              <FormLabel>分类描述</FormLabel>
              <Input 
                value={newBranchDescription} 
                onChange={(e) => setNewBranchDescription(e.target.value)}
                placeholder="简短描述此分类"
              />
            </FormControl>
            
            <FormControl mb={3}>
              <FormLabel>知识领域</FormLabel>
              <Select 
                value={newBranchCategory} 
                onChange={(e) => setNewBranchCategory(e.target.value)}
              >
                {KNOWLEDGE_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={addNewBranch}
              isDisabled={!newBranchName.trim()}
            >
              添加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default KnowledgeTree; 