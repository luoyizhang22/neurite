import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
  VStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Radio,
  RadioGroup,
  Tooltip,
  Icon,
  Badge,
  Code
} from '@chakra-ui/react';
import { 
  FiInfo, 
  FiUser, 
  FiSettings, 
  FiMap, 
  FiCpu, 
  FiSave, 
  FiRefreshCw,
  FiHelpCircle,
  FiGlobe
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const SettingsPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const { t } = useTranslation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 表单状态管理
  const [settings, setSettings] = useState({
    // 用户界面设置
    language: 'zh',
    fontSize: 14,
    compactMode: false,
    autosaveInterval: 5,
    showMiniMap: true,
    
    // 图谱默认设置
    defaultNodeType: 'text',
    connectionStyle: 'curved',
    snapToGrid: true,
    gridSize: 20,
    defaultZoom: 1,
    
    // AI设置
    enableAI: true,
    aiModel: 'gpt-4',
    apiKey: '',
    maxTokens: 1000,
    temperature: 0.7,
    
    // 数据设置
    syncEnabled: false,
    backupFrequency: 'daily',
    maxGraphs: 50
  });
  
  // 处理表单输入变化
  const handleChange = (field: string, value: any) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };
  
  // 保存设置
  const saveSettings = () => {
    // 实际应用中需要将设置保存到Redux和持久化存储
    console.log('保存设置:', settings);
    
    toast({
      title: "设置已保存",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };
  
  // 重置设置
  const resetSettings = () => {
    // 实际应用中需要重置为默认值
    toast({
      title: "设置已重置为默认值",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Add a language settings section to the UI
  const renderLanguageSettings = () => {
    return (
      <Box mb={6} p={4} borderWidth="1px" borderRadius="md">
        <Flex align="center" mb={4}>
          <Icon as={FiGlobe} mr={2} />
          <Heading size="md">{t('settings.language')}</Heading>
        </Flex>
        <LanguageSwitcher />
      </Box>
    );
  };
  
  return (
    <Container maxW="container.lg" py={8}>
      <Heading mb={6}>{t('settings.title') || 'Settings'}</Heading>
      
      <Tabs variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab><Icon as={FiUser} mr={2} /> {t('settings.profile') || 'Profile'}</Tab>
          <Tab><Icon as={FiSettings} mr={2} /> {t('settings.appearance') || 'Appearance'}</Tab>
          <Tab><Icon as={FiMap} mr={2} /> {t('settings.mindMap') || 'Mind Map'}</Tab>
          <Tab><Icon as={FiCpu} mr={2} /> {t('settings.aiModel') || 'AI Model'}</Tab>
        </TabList>
        
        <TabPanels>
          {/* Profile settings */}
          <TabPanel>
            {/* Language settings - add at the top of profile tab */}
            {renderLanguageSettings()}
            
            <VStack align="start" spacing={6} width="100%">
              <Heading size="md" mb={4}>用户界面设置</Heading>
              
              <FormControl>
                <FormLabel>字体大小 ({settings.fontSize}px)</FormLabel>
                <Slider
                  min={10}
                  max={20}
                  step={1}
                  value={settings.fontSize}
                  onChange={(value) => handleChange('fontSize', value)}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">
                  深色模式
                </FormLabel>
                <Switch
                  isChecked={colorMode === 'dark'}
                  onChange={toggleColorMode}
                  colorScheme="purple"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">
                  紧凑模式
                </FormLabel>
                <Switch
                  isChecked={settings.compactMode}
                  onChange={(e) => handleChange('compactMode', e.target.checked)}
                  colorScheme="purple"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>自动保存间隔 (分钟)</FormLabel>
                <Select
                  value={settings.autosaveInterval}
                  onChange={(e) => handleChange('autosaveInterval', parseInt(e.target.value))}
                >
                  <option value="1">1</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="0">关闭自动保存</option>
                </Select>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">
                  显示小地图
                </FormLabel>
                <Switch
                  isChecked={settings.showMiniMap}
                  onChange={(e) => handleChange('showMiniMap', e.target.checked)}
                  colorScheme="purple"
                />
              </FormControl>
            </VStack>
          </TabPanel>
          
          {/* Other tab panels... */}
        </TabPanels>
      </Tabs>
      
      <Flex mt={6} justify="flex-end">
        <Button 
          mr={4} 
          leftIcon={<FiRefreshCw />}
          onClick={resetSettings}
        >
          重置为默认值
        </Button>
        <Button 
          colorScheme="purple" 
          leftIcon={<FiSave />}
          onClick={saveSettings}
        >
          保存设置
        </Button>
      </Flex>
    </Container>
  );
};

export default SettingsPage; 