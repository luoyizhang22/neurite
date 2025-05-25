import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
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
  AlertTitle,
  AlertDescription,
  Collapse,
  Link
} from '@chakra-ui/react';
import { FiCheck, FiX, FiSettings, FiCloud, FiServer, FiExternalLink } from 'react-icons/fi';
import aiService, { AIProvider } from '@api/aiService';

const AIModelSettings = () => {
  const toast = useToast();
  
  // 状态
  const [useProxy, setUseProxy] = useState(true);
  const [proxyUrl, setProxyUrl] = useState('http://localhost:7070');
  const [ollamaEnabled, setOllamaEnabled] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  
  // API密钥状态
  const [apiKeys, setApiKeys] = useState<{[key in AIProvider]?: string}>({
    openai: '',
    anthropic: '',
    deepseek: '',
    gemini: '',
    qwen: '',
    groq: ''
  });
  
  // API基础URL状态
  const [baseUrls, setBaseUrls] = useState<{[key in AIProvider]?: string}>({
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
    qwen: 'https://dashscope.aliyuncs.com/api/v1',
    groq: 'https://api.groq.com/openai/v1'
  });
  
  // 连接状态
  const [connectionStatus, setConnectionStatus] = useState<{[key in AIProvider]?: 'idle' | 'checking' | 'success' | 'failed'}>({
    openai: 'idle',
    anthropic: 'idle',
    deepseek: 'idle',
    gemini: 'idle',
    qwen: 'idle',
    groq: 'idle',
    ollama: 'idle'
  });
  
  // 自定义模型状态
  const [customModels, setCustomModels] = useState<{name: string, endpoint: string, apiKey: string}[]>([]);
  
  // 显示信息警告
  const [showApiWarning, setShowApiWarning] = useState(false);
  
  // 初始化
  useEffect(() => {
    // 从本地存储加载配置
    const savedConfig = localStorage.getItem('aiServiceConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setUseProxy(config.useProxy);
        setProxyUrl(config.proxyUrl);
        setOllamaEnabled(config.ollamaEnabled);
        setOllamaUrl(config.ollamaUrl);
        
        // 加载API密钥
        const keys: {[key in AIProvider]?: string} = {};
        const urls: {[key in AIProvider]?: string} = {};
        
        Object.entries(config.providers).forEach(([provider, providerConfig]: [string, any]) => {
          if (providerConfig?.apiKey) {
            keys[provider as AIProvider] = providerConfig.apiKey;
          }
          if (providerConfig?.baseUrl) {
            urls[provider as AIProvider] = providerConfig.baseUrl;
          }
        });
        
        setApiKeys(keys);
        setBaseUrls(urls);
        
        // 加载自定义模型
        const custom = config.providers.custom?.models || [];
        setCustomModels(custom.map((model: any) => ({
          name: model.name,
          endpoint: model.baseUrl || '',
          apiKey: model.apiKey || ''
        })));
        
        // 更新服务配置
        aiService.updateConfig(config);
      } catch (error) {
        console.error('Failed to load AI service config:', error);
      }
    }
  }, []);
  
  // 检查Ollama连接状态
  useEffect(() => {
    if (ollamaEnabled) {
      checkOllamaStatus();
    }
  }, [ollamaEnabled, ollamaUrl]);
  
  // 保存配置
  const saveConfig = () => {
    // 构建配置对象
    const config = {
      useProxy,
      proxyUrl,
      ollamaEnabled,
      ollamaUrl,
      providers: {
        openai: {
          apiKey: apiKeys.openai,
          baseUrl: baseUrls.openai
        },
        anthropic: {
          apiKey: apiKeys.anthropic,
          baseUrl: baseUrls.anthropic
        },
        deepseek: {
          apiKey: apiKeys.deepseek,
          baseUrl: baseUrls.deepseek
        },
        gemini: {
          apiKey: apiKeys.gemini,
          baseUrl: baseUrls.gemini
        },
        qwen: {
          apiKey: apiKeys.qwen,
          baseUrl: baseUrls.qwen
        },
        groq: {
          apiKey: apiKeys.groq,
          baseUrl: baseUrls.groq
        },
        ollama: {
          baseUrl: ollamaUrl
        },
        custom: {
          models: customModels.map(model => ({
            id: model.name.toLowerCase().replace(/\s+/g, '-'),
            name: model.name,
            provider: 'custom' as AIProvider,
            apiKey: model.apiKey,
            baseUrl: model.endpoint
          }))
        }
      },
      defaultProvider: 'openai' as AIProvider
    };
    
    // 更新服务配置
    aiService.updateConfig(config);
    
    // 保存到本地存储
    localStorage.setItem('aiServiceConfig', JSON.stringify(config));
    
    toast({
      title: 'AI配置已保存',
      description: '你的API密钥和设置已成功保存',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // 测试API连接
  const testConnection = async (provider: AIProvider) => {
    setConnectionStatus(prev => ({ ...prev, [provider]: 'checking' }));
    
    try {
      const result = await aiService.testConnection(
        provider, 
        apiKeys[provider], 
        baseUrls[provider]
      );
      
      setConnectionStatus(prev => ({ 
        ...prev, 
        [provider]: result ? 'success' : 'failed' 
      }));
      
      toast({
        title: result ? '连接成功' : '连接失败',
        description: result 
          ? `成功连接到${provider}API` 
          : `无法连接到${provider}API，请检查你的密钥和URL`,
        status: result ? 'success' : 'error',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error(`Failed to test connection to ${provider}:`, error);
      setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
      
      toast({
        title: '连接测试失败',
        description: `无法连接到${provider}API：${(error as Error).message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // 检查Ollama状态
  const checkOllamaStatus = async () => {
    setOllamaStatus('checking');
    
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        setOllamaStatus('available');
      } else {
        setOllamaStatus('unavailable');
      }
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
      setOllamaStatus('unavailable');
    }
  };
  
  // 处理API密钥变更
  const handleApiKeyChange = (provider: AIProvider, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };
  
  // 处理基础URL变更
  const handleBaseUrlChange = (provider: AIProvider, value: string) => {
    setBaseUrls(prev => ({ ...prev, [provider]: value }));
  };
  
  // 添加自定义模型
  const addCustomModel = () => {
    setCustomModels(prev => [...prev, { name: '自定义模型', endpoint: '', apiKey: '' }]);
  };
  
  // 更新自定义模型
  const updateCustomModel = (index: number, field: keyof typeof customModels[0], value: string) => {
    setCustomModels(prev => {
      const newModels = [...prev];
      newModels[index] = { ...newModels[index], [field]: value };
      return newModels;
    });
  };
  
  // 删除自定义模型
  const removeCustomModel = (index: number) => {
    setCustomModels(prev => prev.filter((_, i) => i !== index));
  };
  
  // 渲染连接状态徽章
  const renderStatusBadge = (status: 'idle' | 'checking' | 'success' | 'failed') => {
    switch (status) {
      case 'idle':
        return <Badge colorScheme="gray">未测试</Badge>;
      case 'checking':
        return <Badge colorScheme="blue">测试中...</Badge>;
      case 'success':
        return <Badge colorScheme="green">连接成功</Badge>;
      case 'failed':
        return <Badge colorScheme="red">连接失败</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Box p={4} borderRadius="md" boxShadow="md" bg="white">
      <Heading size="lg" mb={6}>AI模型设置</Heading>
      
      <Collapse in={showApiWarning} animateOpacity>
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>API密钥安全提示</AlertTitle>
            <AlertDescription>
              您的API密钥将存储在本地浏览器中。请勿在公共设备上保存密钥，并确保您的浏览器安全。
              如果启用代理模式，密钥将通过本地代理服务器传递，不会直接从前端发送到API提供商。
            </AlertDescription>
          </Box>
        </Alert>
      </Collapse>

      <Card mb={6}>
        <CardHeader>
          <Heading size="md">通用设置</Heading>
        </CardHeader>
        <CardBody>
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel mb="0">
              使用API代理服务器
            </FormLabel>
            <Switch
              isChecked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
            />
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>代理服务器URL</FormLabel>
            <Input
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="http://localhost:7070"
              isDisabled={!useProxy}
            />
          </FormControl>
          
          <Divider my={4} />
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel mb="0">
              启用本地Ollama
            </FormLabel>
            <Switch
              isChecked={ollamaEnabled}
              onChange={(e) => setOllamaEnabled(e.target.checked)}
            />
            <Box ml={4}>
              {ollamaStatus === 'idle' && <Badge colorScheme="gray">未检查</Badge>}
              {ollamaStatus === 'checking' && <Badge colorScheme="blue">检查中...</Badge>}
              {ollamaStatus === 'available' && <Badge colorScheme="green">可用</Badge>}
              {ollamaStatus === 'unavailable' && <Badge colorScheme="red">不可用</Badge>}
            </Box>
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Ollama服务器URL</FormLabel>
            <Input
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              isDisabled={!ollamaEnabled}
            />
          </FormControl>
          
          {ollamaEnabled && ollamaStatus === 'unavailable' && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Ollama服务器不可用</AlertTitle>
                <AlertDescription>
                  无法连接到Ollama服务器。请确保Ollama已安装并正在运行。
                  <Link href="https://ollama.ai/download" isExternal color="blue.500" ml={1}>
                    下载Ollama <FiExternalLink />
                  </Link>
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </CardBody>
      </Card>

      <Tabs isFitted variant="enclosed" colorScheme="blue">
        <TabList mb="1em">
          <Tab><Flex align="center"><FiCloud /><Text ml={2}>云端API</Text></Flex></Tab>
          <Tab><Flex align="center"><FiServer /><Text ml={2}>本地模型</Text></Flex></Tab>
          <Tab><Flex align="center"><FiSettings /><Text ml={2}>自定义API</Text></Flex></Tab>
        </TabList>
        
        <TabPanels>
          {/* 云端API设置 */}
          <TabPanel>
            <Card mb={4}>
              <CardHeader>
                <Heading size="md">OpenAI</Heading>
              </CardHeader>
              <CardBody>
                <FormControl mb={4}>
                  <FormLabel>API密钥</FormLabel>
                  <Input
                    type="password"
                    value={apiKeys.openai || ''}
                    onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                    placeholder="sk-..."
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>API基础URL</FormLabel>
                  <Input
                    value={baseUrls.openai || ''}
                    onChange={(e) => handleBaseUrlChange('openai', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </FormControl>
                <Flex justify="space-between" align="center">
                  <Box>{renderStatusBadge(connectionStatus.openai || 'idle')}</Box>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => testConnection('openai')}
                    isDisabled={!apiKeys.openai}
                  >
                    测试连接
                  </Button>
                </Flex>
              </CardBody>
            </Card>
            
            <Card mb={4}>
              <CardHeader>
                <Heading size="md">Anthropic Claude</Heading>
              </CardHeader>
              <CardBody>
                <FormControl mb={4}>
                  <FormLabel>API密钥</FormLabel>
                  <Input
                    type="password"
                    value={apiKeys.anthropic || ''}
                    onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                    placeholder="sk-ant-..."
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>API基础URL</FormLabel>
                  <Input
                    value={baseUrls.anthropic || ''}
                    onChange={(e) => handleBaseUrlChange('anthropic', e.target.value)}
                    placeholder="https://api.anthropic.com/v1"
                  />
                </FormControl>
                <Flex justify="space-between" align="center">
                  <Box>{renderStatusBadge(connectionStatus.anthropic || 'idle')}</Box>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => testConnection('anthropic')}
                    isDisabled={!apiKeys.anthropic}
                  >
                    测试连接
                  </Button>
                </Flex>
              </CardBody>
            </Card>
            
            <Card mb={4}>
              <CardHeader>
                <Heading size="md">DeepSeek</Heading>
              </CardHeader>
              <CardBody>
                <FormControl mb={4}>
                  <FormLabel>API密钥</FormLabel>
                  <Input
                    type="password"
                    value={apiKeys.deepseek || ''}
                    onChange={(e) => handleApiKeyChange('deepseek', e.target.value)}
                    placeholder="..."
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>API基础URL</FormLabel>
                  <Input
                    value={baseUrls.deepseek || ''}
                    onChange={(e) => handleBaseUrlChange('deepseek', e.target.value)}
                    placeholder="https://api.deepseek.com/v1"
                  />
                </FormControl>
                <Flex justify="space-between" align="center">
                  <Box>{renderStatusBadge(connectionStatus.deepseek || 'idle')}</Box>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => testConnection('deepseek')}
                    isDisabled={!apiKeys.deepseek}
                  >
                    测试连接
                  </Button>
                </Flex>
              </CardBody>
            </Card>
            
            <Card mb={4}>
              <CardHeader>
                <Heading size="md">Google Gemini</Heading>
              </CardHeader>
              <CardBody>
                <FormControl mb={4}>
                  <FormLabel>API密钥</FormLabel>
                  <Input
                    type="password"
                    value={apiKeys.gemini || ''}
                    onChange={(e) => handleApiKeyChange('gemini', e.target.value)}
                    placeholder="..."
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>API基础URL</FormLabel>
                  <Input
                    value={baseUrls.gemini || ''}
                    onChange={(e) => handleBaseUrlChange('gemini', e.target.value)}
                    placeholder="https://generativelanguage.googleapis.com/v1beta"
                  />
                </FormControl>
                <Flex justify="space-between" align="center">
                  <Box>{renderStatusBadge(connectionStatus.gemini || 'idle')}</Box>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => testConnection('gemini')}
                    isDisabled={!apiKeys.gemini}
                  >
                    测试连接
                  </Button>
                </Flex>
              </CardBody>
            </Card>
            
            <Card mb={4}>
              <CardHeader>
                <Heading size="md">阿里云通义千问</Heading>
              </CardHeader>
              <CardBody>
                <FormControl mb={4}>
                  <FormLabel>API密钥</FormLabel>
                  <Input
                    type="password"
                    value={apiKeys.qwen || ''}
                    onChange={(e) => handleApiKeyChange('qwen', e.target.value)}
                    placeholder="..."
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>API基础URL</FormLabel>
                  <Input
                    value={baseUrls.qwen || ''}
                    onChange={(e) => handleBaseUrlChange('qwen', e.target.value)}
                    placeholder="https://dashscope.aliyuncs.com/api/v1"
                  />
                </FormControl>
                <Flex justify="space-between" align="center">
                  <Box>{renderStatusBadge(connectionStatus.qwen || 'idle')}</Box>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => testConnection('qwen')}
                    isDisabled={!apiKeys.qwen}
                  >
                    测试连接
                  </Button>
                </Flex>
              </CardBody>
            </Card>
            
            <Card mb={4}>
              <CardHeader>
                <Heading size="md">Groq</Heading>
              </CardHeader>
              <CardBody>
                <FormControl mb={4}>
                  <FormLabel>API密钥</FormLabel>
                  <Input
                    type="password"
                    value={apiKeys.groq || ''}
                    onChange={(e) => handleApiKeyChange('groq', e.target.value)}
                    placeholder="gsk_..."
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>API基础URL</FormLabel>
                  <Input
                    value={baseUrls.groq || ''}
                    onChange={(e) => handleBaseUrlChange('groq', e.target.value)}
                    placeholder="https://api.groq.com/openai/v1"
                  />
                </FormControl>
                <Flex justify="space-between" align="center">
                  <Box>{renderStatusBadge(connectionStatus.groq || 'idle')}</Box>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => testConnection('groq')}
                    isDisabled={!apiKeys.groq}
                  >
                    测试连接
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* 本地模型设置 */}
          <TabPanel>
            <Card mb={4}>
              <CardHeader>
                <Heading size="md">Ollama设置</Heading>
              </CardHeader>
              <CardBody>
                <Alert status={ollamaStatus === 'available' ? 'success' : 'info'} mb={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      {ollamaStatus === 'available' ? 'Ollama已连接' : '关于Ollama'}
                    </AlertTitle>
                    <AlertDescription>
                      {ollamaStatus === 'available' 
                        ? '您的Ollama服务正在运行，可以使用本地模型。'
                        : 'Ollama允许您在本地计算机上运行大型语言模型。需要单独安装。'}
                      {ollamaStatus !== 'available' && (
                        <Link href="https://ollama.ai/download" isExternal color="blue.500" ml={1}>
                          下载Ollama <FiExternalLink />
                        </Link>
                      )}
                    </AlertDescription>
                  </Box>
                </Alert>
                
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel mb="0">
                    启用本地Ollama
                  </FormLabel>
                  <Switch
                    isChecked={ollamaEnabled}
                    onChange={(e) => setOllamaEnabled(e.target.checked)}
                  />
                </FormControl>
                
                <FormControl mb={4}>
                  <FormLabel>Ollama服务器URL</FormLabel>
                  <Input
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    isDisabled={!ollamaEnabled}
                  />
                </FormControl>
                
                <Flex justify="space-between" align="center">
                  <Box>
                    {ollamaStatus === 'idle' && <Badge colorScheme="gray">未检查</Badge>}
                    {ollamaStatus === 'checking' && <Badge colorScheme="blue">检查中...</Badge>}
                    {ollamaStatus === 'available' && <Badge colorScheme="green">可用</Badge>}
                    {ollamaStatus === 'unavailable' && <Badge colorScheme="red">不可用</Badge>}
                  </Box>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={checkOllamaStatus}
                    isDisabled={!ollamaEnabled}
                  >
                    检查连接
                  </Button>
                </Flex>
              </CardBody>
            </Card>
            
            {ollamaStatus === 'available' && (
              <Card>
                <CardHeader>
                  <Heading size="md">可用的本地模型</Heading>
                </CardHeader>
                <CardBody>
                  <Text mb={4}>
                    请使用Ollama命令行工具或Web UI安装和管理模型。
                    安装后的模型将自动显示在AI节点的模型选择下拉列表中。
                  </Text>
                  <Link href="https://ollama.ai/library" isExternal color="blue.500">
                    浏览可用模型 <FiExternalLink />
                  </Link>
                </CardBody>
              </Card>
            )}
          </TabPanel>
          
          {/* 自定义API设置 */}
          <TabPanel>
            <Card mb={4}>
              <CardHeader>
                <Heading size="md">自定义模型</Heading>
              </CardHeader>
              <CardBody>
                <Text mb={4}>
                  您可以添加自定义模型来连接不在列表中的API端点。
                  请确保这些API遵循OpenAI兼容的接口规范。
                </Text>
                
                {customModels.map((model, index) => (
                  <Box key={index} mb={6} p={4} borderWidth="1px" borderRadius="md">
                    <Flex justify="space-between" mb={2}>
                      <Heading size="sm">自定义模型 #{index + 1}</Heading>
                      <Button
                        size="xs"
                        colorScheme="red"
                        onClick={() => removeCustomModel(index)}
                      >
                        删除
                      </Button>
                    </Flex>
                    
                    <FormControl mb={3}>
                      <FormLabel>模型名称</FormLabel>
                      <Input
                        value={model.name}
                        onChange={(e) => updateCustomModel(index, 'name', e.target.value)}
                        placeholder="我的自定义模型"
                      />
                    </FormControl>
                    
                    <FormControl mb={3}>
                      <FormLabel>API端点</FormLabel>
                      <Input
                        value={model.endpoint}
                        onChange={(e) => updateCustomModel(index, 'endpoint', e.target.value)}
                        placeholder="https://api.example.com/v1/chat/completions"
                      />
                    </FormControl>
                    
                    <FormControl mb={3}>
                      <FormLabel>API密钥</FormLabel>
                      <Input
                        type="password"
                        value={model.apiKey}
                        onChange={(e) => updateCustomModel(index, 'apiKey', e.target.value)}
                        placeholder="在这里输入您的API密钥"
                      />
                    </FormControl>
                  </Box>
                ))}
                
                <Button colorScheme="blue" onClick={addCustomModel} mt={2}>
                  添加自定义模型
                </Button>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <Flex justify="flex-end" mt={6}>
        <Button
          colorScheme="blue"
          size="lg"
          onClick={saveConfig}
        >
          保存所有设置
        </Button>
      </Flex>
    </Box>
  );
};

export default AIModelSettings; 