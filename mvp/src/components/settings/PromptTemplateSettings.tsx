import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Textarea,
  Switch,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Flex,
  Badge,
  Select,
  useToast,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Alert,
  AlertIcon,
  Tooltip,
  useColorModeValue,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  VStack,
  CloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner
} from '@chakra-ui/react';
import { FiSave, FiRefreshCw, FiInfo, FiCheck, FiBookOpen, FiDownload, FiUpload, FiPlus, FiEdit, FiMoreVertical, FiCopy, FiTrash, FiShare } from 'react-icons/fi';
import { AnalysisType, PromptBuilder } from '../../api/PromptBuilder';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateUserPreferences } from '../../store/slices/userSlice';

// 分析类型名称映射
const analysisTypeNames: Record<AnalysisType, string> = {
  'compare': '比较分析',
  'synthesize': '综合分析',
  'relations': '关系探索',
  'debate': '辩论式思考',
  'custom': '自定义分析'
};

// 分析类型描述
const analysisTypeDescriptions: Record<AnalysisType, string> = {
  'compare': '比较不同概念之间的异同点，找出共性和差异',
  'synthesize': '综合多种信息，形成更高层次的理解和洞察',
  'relations': '发现不同概念之间的关系和连接，包括因果关系、层次关系等',
  'debate': '从多个角度分析问题，提供平衡的观点和辩证思考',
  'custom': '根据用户的具体指令灵活分析内容，提供定制化的见解'
};

// 默认的系统提示词（从PromptBuilder中获取）
const defaultSystemPrompts: Record<AnalysisType, string> = {
  'compare': PromptBuilder.buildSystemPrompt('compare'),
  'synthesize': PromptBuilder.buildSystemPrompt('synthesize'),
  'relations': PromptBuilder.buildSystemPrompt('relations'),
  'debate': PromptBuilder.buildSystemPrompt('debate'),
  'custom': PromptBuilder.buildSystemPrompt('custom')
};

// 定义模板库接口
interface TemplateLibraryItem {
  id: string;
  name: string;
  type: AnalysisType;
  content: string;
  description?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

const PromptTemplateSettings = () => {
  const toast = useToast();
  const dispatch = useDispatch();
  const userPreferences = useSelector((state: RootState) => state.user.preferences);
  
  // 颜色模式
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // 状态
  const [useCustomPrompts, setUseCustomPrompts] = useState(userPreferences.useCustomPrompts || false);
  const [customPromptTemplates, setCustomPromptTemplates] = useState<Record<AnalysisType, string>>(
    userPreferences.customPromptTemplates || {}
  );
  const [currentType, setCurrentType] = useState<AnalysisType>('compare');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 模板库状态
  const [templateLibrary, setTemplateLibrary] = useState<TemplateLibraryItem[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateLibraryItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  
  // 新增模板状态
  const { isOpen: isNewTemplateModalOpen, onOpen: onOpenNewTemplateModal, onClose: onCloseNewTemplateModal } = useDisclosure();
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    type: AnalysisType;
    content: string;
    description: string;
  }>({
    name: '',
    type: 'custom',
    content: '',
    description: ''
  });
  
  // 导入导出Modal
  const { isOpen: isImportExportOpen, onOpen: onOpenImportExport, onClose: onCloseImportExport } = useDisclosure();
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('export');
  const [importData, setImportData] = useState('');
  const [exportData, setExportData] = useState('');
  
  // 初始化模板库
  useEffect(() => {
    loadTemplateLibrary();
  }, []);
  
  // 筛选模板库
  useEffect(() => {
    if (templateLibrary.length === 0) return;
    
    if (!templateSearchQuery) {
      // 如果没有搜索查询，则按类型筛选
      setFilteredTemplates(templateLibrary.filter(template => template.type === currentType));
    } else {
      // 如果有搜索查询，则按查询和类型筛选
      const query = templateSearchQuery.toLowerCase();
      setFilteredTemplates(
        templateLibrary.filter(template => 
          template.type === currentType && 
          (template.name.toLowerCase().includes(query) || 
           (template.description || '').toLowerCase().includes(query))
        )
      );
    }
  }, [templateLibrary, currentType, templateSearchQuery]);
  
  // 加载模板库
  const loadTemplateLibrary = () => {
    try {
      // 首先加载默认模板
      const defaultTemplates: TemplateLibraryItem[] = Object.entries(analysisTypeNames).map(([type, name]) => ({
        id: `default_${type}`,
        name: `默认${name}模板`,
        type: type as AnalysisType,
        content: defaultSystemPrompts[type as AnalysisType],
        description: analysisTypeDescriptions[type as AnalysisType],
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      // 然后尝试从localStorage加载自定义模板
      const savedTemplatesStr = localStorage.getItem('promptTemplateLibrary');
      const savedTemplates: TemplateLibraryItem[] = savedTemplatesStr ? JSON.parse(savedTemplatesStr) : [];
      
      // 合并模板
      const allTemplates = [...defaultTemplates, ...savedTemplates];
      setTemplateLibrary(allTemplates);
      
      // 设置筛选模板
      setFilteredTemplates(allTemplates.filter(template => template.type === currentType));
    } catch (error) {
      console.error('加载模板库失败:', error);
      toast({
        title: '加载模板库失败',
        description: '无法加载自定义模板库，已恢复默认模板',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 获取当前编辑的提示词模板
  const getCurrentTemplate = () => {
    return customPromptTemplates[currentType] || defaultSystemPrompts[currentType];
  };
  
  // 更新当前模板
  const updateCurrentTemplate = (value: string) => {
    setCustomPromptTemplates(prev => ({
      ...prev,
      [currentType]: value
    }));
  };
  
  // 重置当前模板为默认值
  const resetCurrentTemplate = () => {
    const updatedTemplates = { ...customPromptTemplates };
    delete updatedTemplates[currentType]; // 删除当前类型的自定义模板
    setCustomPromptTemplates(updatedTemplates);
    
    toast({
      title: '模板已重置',
      description: `${analysisTypeNames[currentType]}模板已恢复默认设置`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // 保存所有设置
  const saveSettings = () => {
    setIsSaving(true);
    
    try {
      // 更新用户偏好设置
      const updatedPreferences = {
        ...userPreferences,
        useCustomPrompts,
        customPromptTemplates
      };
      
      dispatch(updateUserPreferences(updatedPreferences));
      
      // 保存到本地存储
      localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
      
      toast({
        title: '设置已保存',
        description: '自定义提示词模板设置已成功保存',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('保存设置失败:', error);
      toast({
        title: '保存失败',
        description: '无法保存设置，请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 处理导入模板
  const handleImport = () => {
    try {
      const importedData = JSON.parse(importData);
      
      // 验证导入数据格式
      if (!importedData.templates || !Array.isArray(importedData.templates)) {
        throw new Error('导入数据格式不正确');
      }
      
      // 处理导入的模板
      const templates = importedData.templates as TemplateLibraryItem[];
      const now = new Date().toISOString();
      
      // 为每个模板添加新的ID和时间戳
      const processedTemplates = templates.map(template => ({
        ...template,
        id: `imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        isDefault: false,
        createdAt: now,
        updatedAt: now
      }));
      
      // 合并到现有模板库
      const updatedLibrary = [
        ...templateLibrary.filter(t => !t.isDefault), // 保留所有非默认模板
        ...processedTemplates
      ];
      
      // 保存更新后的模板库
      localStorage.setItem('promptTemplateLibrary', JSON.stringify(updatedLibrary.filter(t => !t.isDefault)));
      setTemplateLibrary([
        ...templateLibrary.filter(t => t.isDefault), // 保留默认模板
        ...updatedLibrary.filter(t => !t.isDefault)
      ]);
      
      toast({
        title: '导入成功',
        description: `已成功导入 ${processedTemplates.length} 个模板`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 关闭导入弹窗
      onCloseImportExport();
      setImportData('');
    } catch (error) {
      console.error('导入模板失败:', error);
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '导入数据格式不正确',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // 处理导出模板
  const handleExport = () => {
    try {
      // 准备要导出的模板
      const templatesToExport = templateLibrary.filter(t => !t.isDefault); // 只导出非默认模板
      
      // 创建导出数据对象
      const exportDataObj = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        templates: templatesToExport
      };
      
      // 转换为JSON字符串
      const jsonData = JSON.stringify(exportDataObj, null, 2);
      setExportData(jsonData);
      
      toast({
        title: '准备导出数据',
        description: '已生成导出数据，您可以复制或下载',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('准备导出数据失败:', error);
      toast({
        title: '导出准备失败',
        description: '无法生成导出数据',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 下载导出数据
  const downloadExportData = () => {
    try {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt_templates_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: '导出成功',
        description: '提示词模板已成功导出为JSON文件',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onCloseImportExport();
    } catch (error) {
      console.error('下载导出数据失败:', error);
      toast({
        title: '导出失败',
        description: '无法下载导出数据',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 保存新模板
  const saveNewTemplate = () => {
    try {
      if (!newTemplate.name.trim()) {
        toast({
          title: '无法保存模板',
          description: '模板名称不能为空',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      if (!newTemplate.content.trim()) {
        toast({
          title: '无法保存模板',
          description: '模板内容不能为空',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // 创建新模板对象
      const now = new Date().toISOString();
      const templateItem: TemplateLibraryItem = {
        id: `template_${Date.now()}`,
        name: newTemplate.name,
        type: newTemplate.type,
        content: newTemplate.content,
        description: newTemplate.description,
        isDefault: false,
        createdAt: now,
        updatedAt: now
      };
      
      // 更新模板库
      const updatedLibrary = [...templateLibrary.filter(t => !t.isDefault), templateItem];
      
      // 保存到localStorage
      localStorage.setItem('promptTemplateLibrary', JSON.stringify(updatedLibrary.filter(t => !t.isDefault)));
      
      // 更新状态
      setTemplateLibrary([...templateLibrary.filter(t => t.isDefault), ...updatedLibrary.filter(t => !t.isDefault)]);
      
      // 关闭模态框并重置表单
      onCloseNewTemplateModal();
      setNewTemplate({
        name: '',
        type: 'custom',
        content: '',
        description: ''
      });
      
      toast({
        title: '模板已保存',
        description: `模板"${newTemplate.name}"已成功保存到库中`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('保存模板失败:', error);
      toast({
        title: '保存失败',
        description: '无法保存模板，请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 使用选定的模板
  const useSelectedTemplate = (templateId: string) => {
    const template = templateLibrary.find(t => t.id === templateId);
    
    if (!template) {
      toast({
        title: '找不到模板',
        description: '无法加载所选模板',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 更新当前类型的模板
    updateCurrentTemplate(template.content);
    setIsEditing(true);
    
    toast({
      title: '模板已加载',
      description: `已加载"${template.name}"模板`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // 删除模板
  const deleteTemplate = (templateId: string) => {
    try {
      const template = templateLibrary.find(t => t.id === templateId);
      
      if (!template) {
        return;
      }
      
      // 如果是默认模板，不允许删除
      if (template.isDefault) {
        toast({
          title: '无法删除',
          description: '默认模板不能被删除',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // 更新模板库
      const updatedLibrary = templateLibrary.filter(t => t.id !== templateId);
      setTemplateLibrary(updatedLibrary);
      
      // 保存到localStorage
      localStorage.setItem('promptTemplateLibrary', JSON.stringify(updatedLibrary.filter(t => !t.isDefault)));
      
      toast({
        title: '模板已删除',
        description: `模板"${template.name}"已从库中删除`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('删除模板失败:', error);
      toast({
        title: '删除失败',
        description: '无法删除模板，请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 渲染提示词示例预览
  const renderTemplatePreview = () => {
    return (
      <Box 
        p={3} 
        bg={bgColor} 
        borderWidth="1px" 
        borderRadius="md" 
        borderColor={borderColor}
        fontSize="sm"
        fontFamily="monospace"
        whiteSpace="pre-wrap"
        maxHeight="200px"
        overflowY="auto"
        mb={4}
      >
        {getCurrentTemplate()}
      </Box>
    );
  };
  
  // 渲染模板库
  const renderTemplateLibrary = () => {
    if (filteredTemplates.length === 0) {
      return (
        <Box p={4} textAlign="center" color="gray.500">
          <Text>没有找到相关模板</Text>
        </Box>
      );
    }
    
    return (
      <VStack spacing={3} align="stretch" mt={2}>
        {filteredTemplates.map(template => (
          <Card key={template.id} size="sm" variant="outline">
            <CardBody p={3}>
              <Flex justify="space-between" align="center">
                <Box>
                  <Flex align="center">
                    <Text fontWeight="medium">{template.name}</Text>
                    {template.isDefault && (
                      <Badge ml={2} colorScheme="blue" variant="subtle">系统</Badge>
                    )}
                  </Flex>
                  {template.description && (
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>{template.description}</Text>
                  )}
                </Box>
                <Flex>
                  <Button 
                    size="xs" 
                    colorScheme="blue" 
                    variant="ghost"
                    onClick={() => useSelectedTemplate(template.id)}
                    mr={1}
                  >
                    使用
                  </Button>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FiMoreVertical />}
                      variant="ghost"
                      size="xs"
                    />
                    <MenuList fontSize="sm">
                      <MenuItem icon={<FiCopy />} onClick={() => useSelectedTemplate(template.id)}>使用此模板</MenuItem>
                      {!template.isDefault && (
                        <MenuItem icon={<FiTrash />} onClick={() => deleteTemplate(template.id)}>删除模板</MenuItem>
                      )}
                    </MenuList>
                  </Menu>
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  };
  
  return (
    <Box p={4}>
      <Heading size="md" mb={4}>提示词模板设置</Heading>
      
      <Alert status="info" mb={4} borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="medium">提示词模板说明</Text>
          <Text fontSize="sm">
            提示词模板决定了AI分析内容的方式和回答的格式。您可以根据自己的需求自定义这些模板，
            使AI生成更符合您预期的回答。
          </Text>
        </Box>
      </Alert>
      
      <FormControl display="flex" alignItems="center" mb={4}>
        <FormLabel htmlFor="use-custom-prompts" mb="0">
          使用自定义提示词模板
        </FormLabel>
        <Switch 
          id="use-custom-prompts" 
          isChecked={useCustomPrompts}
          onChange={(e) => setUseCustomPrompts(e.target.checked)}
        />
      </FormControl>
      
      <Flex justify="flex-end" mb={4} gap={2}>
        <Button 
          size="sm" 
          leftIcon={<FiUpload />}
          onClick={() => {
            setImportExportMode('import');
            setImportData('');
            onOpenImportExport();
          }}
        >
          导入模板
        </Button>
        <Button 
          size="sm" 
          leftIcon={<FiDownload />}
          onClick={() => {
            setImportExportMode('export');
            handleExport();
            onOpenImportExport();
          }}
        >
          导出模板
        </Button>
      </Flex>
      
      <Divider my={4} />
      
      <Tabs onChange={(index) => {
        const types: AnalysisType[] = ['compare', 'synthesize', 'relations', 'debate', 'custom'];
        setCurrentType(types[index]);
      }}>
        <TabList>
          {(['compare', 'synthesize', 'relations', 'debate', 'custom'] as AnalysisType[]).map(type => (
            <Tab key={type}>
              {analysisTypeNames[type]}
              {customPromptTemplates[type] && (
                <Badge ml={2} colorScheme="teal" variant="solid" fontSize="xs">
                  自定义
                </Badge>
              )}
            </Tab>
          ))}
        </TabList>
        
        <TabPanels>
          {(['compare', 'synthesize', 'relations', 'debate', 'custom'] as AnalysisType[]).map(type => (
            <TabPanel key={type} p={4}>
              <Box mb={4}>
                <Flex align="center" mb={2}>
                  <Heading size="sm">{analysisTypeNames[type]}提示词模板</Heading>
                  <Tooltip label={analysisTypeDescriptions[type]}>
                    <Box as="span" ml={2}><FiInfo /></Box>
                  </Tooltip>
                </Flex>
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  {analysisTypeDescriptions[type]}
                </Text>
              </Box>
              
              {isEditing ? (
                <FormControl mb={4}>
                  <FormLabel>编辑模板</FormLabel>
                  <Textarea
                    value={getCurrentTemplate()}
                    onChange={(e) => updateCurrentTemplate(e.target.value)}
                    rows={10}
                    fontFamily="monospace"
                    disabled={!useCustomPrompts}
                  />
                </FormControl>
              ) : (
                <>
                  <Flex mb={2} justify="space-between" align="center">
                    <Text fontWeight="medium">当前模板预览</Text>
                    <Tooltip label={useCustomPrompts ? "编辑此模板" : "启用自定义提示词以编辑"}>
                      <Button 
                        size="sm" 
                        leftIcon={<FiBookOpen />}
                        onClick={() => setIsEditing(true)}
                        isDisabled={!useCustomPrompts}
                      >
                        编辑
                      </Button>
                    </Tooltip>
                  </Flex>
                  {renderTemplatePreview()}
                </>
              )}
              
              <Flex justify="flex-end" gap={3}>
                {isEditing && (
                  <>
                    <Button 
                      size="sm" 
                      leftIcon={<FiRefreshCw />}
                      onClick={resetCurrentTemplate}
                      isDisabled={!customPromptTemplates[type]}
                    >
                      重置为默认
                    </Button>
                    <Button 
                      size="sm" 
                      leftIcon={<FiCheck />}
                      colorScheme="teal"
                      onClick={() => setIsEditing(false)}
                    >
                      完成编辑
                    </Button>
                  </>
                )}
              </Flex>
              
              <Divider my={4} />
              
              {/* 模板库部分 */}
              <Box mt={6}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="sm">模板库</Heading>
                  <Button 
                    size="sm" 
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    onClick={() => {
                      setNewTemplate({
                        name: '',
                        type: currentType,
                        content: getCurrentTemplate(),
                        description: ''
                      });
                      onOpenNewTemplateModal();
                    }}
                  >
                    添加模板
                  </Button>
                </Flex>
                
                <Input
                  placeholder="搜索模板..."
                  size="sm"
                  mb={3}
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                />
                
                {renderTemplateLibrary()}
              </Box>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
      
      <Divider my={4} />
      
      <Flex justify="flex-end" mt={4}>
        <Button 
          leftIcon={isSaving ? <Spinner size="sm" /> : <FiSave />}
          colorScheme="blue"
          onClick={saveSettings}
          isLoading={isSaving}
        >
          保存设置
        </Button>
      </Flex>
      
      {/* 新增模板Modal */}
      <Modal isOpen={isNewTemplateModalOpen} onClose={onCloseNewTemplateModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>添加新模板</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>模板名称</FormLabel>
                <Input 
                  placeholder="输入模板名称"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>模板类型</FormLabel>
                <Select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value as AnalysisType})}
                >
                  {Object.entries(analysisTypeNames).map(([type, name]) => (
                    <option key={type} value={type}>{name}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>描述</FormLabel>
                <Input
                  placeholder="输入模板描述（可选）"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>模板内容</FormLabel>
                <Textarea
                  placeholder="输入提示词模板内容"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  rows={8}
                  fontFamily="monospace"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloseNewTemplateModal}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={saveNewTemplate}>
              保存模板
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 导入导出Modal */}
      <Modal isOpen={isImportExportOpen} onClose={onCloseImportExport} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {importExportMode === 'import' ? '导入模板' : '导出模板'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {importExportMode === 'import' ? (
              <>
                <Text mb={3}>请粘贴要导入的JSON格式模板数据：</Text>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                  fontFamily="monospace"
                  placeholder='{"templates": [...]}'
                />
              </>
            ) : (
              <>
                <Text mb={3}>以下是导出的模板数据，您可以复制或下载：</Text>
                <Textarea
                  value={exportData}
                  readOnly
                  rows={10}
                  fontFamily="monospace"
                />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloseImportExport}>
              取消
            </Button>
            {importExportMode === 'import' ? (
              <Button 
                colorScheme="blue"
                onClick={handleImport}
                isDisabled={!importData.trim()}
              >
                导入
              </Button>
            ) : (
              <Button 
                colorScheme="blue"
                leftIcon={<FiDownload />}
                onClick={downloadExportData}
                isDisabled={!exportData.trim()}
              >
                下载
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PromptTemplateSettings; 