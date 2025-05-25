import { useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Flex,
  useColorModeValue,
  Icon,
  Divider,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Button
} from '@chakra-ui/react';
import { FiSettings, FiServer, FiMessageSquare, FiUser, FiLayout } from 'react-icons/fi';
import AIModelSettings from './AIModelSettings';
import PromptTemplateSettings from './PromptTemplateSettings';

type SettingsTab = 'ai' | 'prompts' | 'interface' | 'account';

const SettingsPanel = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  
  // 颜色模式
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <>
      <Button 
        leftIcon={<FiSettings />} 
        onClick={onOpen}
        variant="ghost"
        size="sm"
      >
        设置
      </Button>
      
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            <Flex align="center">
              <Icon as={FiSettings} mr={2} />
              <Heading size="md">设置</Heading>
            </Flex>
            <DrawerCloseButton />
          </DrawerHeader>
          
          <DrawerBody p={0}>
            <Tabs 
              orientation="vertical" 
              variant="line"
              onChange={(index) => {
                const tabs: SettingsTab[] = ['ai', 'prompts', 'interface', 'account'];
                setActiveTab(tabs[index]);
              }}
            >
              <TabList 
                w="200px" 
                borderRight="1px" 
                borderColor={borderColor}
                h="100%"
                py={4}
              >
                <Tab 
                  justifyContent="flex-start" 
                  px={4}
                  _selected={{ color: 'blue.500', borderLeftWidth: '4px', borderLeftColor: 'blue.500', bg: 'blue.50', _dark: { bg: 'blue.900' } }}
                >
                  <Icon as={FiServer} mr={2} />
                  AI模型设置
                </Tab>
                
                <Tab 
                  justifyContent="flex-start" 
                  px={4}
                  _selected={{ color: 'blue.500', borderLeftWidth: '4px', borderLeftColor: 'blue.500', bg: 'blue.50', _dark: { bg: 'blue.900' } }}
                >
                  <Icon as={FiMessageSquare} mr={2} />
                  提示词模板
                </Tab>
                
                <Tab 
                  justifyContent="flex-start" 
                  px={4}
                  _selected={{ color: 'blue.500', borderLeftWidth: '4px', borderLeftColor: 'blue.500', bg: 'blue.50', _dark: { bg: 'blue.900' } }}
                >
                  <Icon as={FiLayout} mr={2} />
                  界面设置
                </Tab>
                
                <Tab 
                  justifyContent="flex-start" 
                  px={4}
                  _selected={{ color: 'blue.500', borderLeftWidth: '4px', borderLeftColor: 'blue.500', bg: 'blue.50', _dark: { bg: 'blue.900' } }}
                >
                  <Icon as={FiUser} mr={2} />
                  账户设置
                </Tab>
              </TabList>
              
              <TabPanels flex="1">
                <TabPanel>
                  <AIModelSettings />
                </TabPanel>
                
                <TabPanel>
                  <PromptTemplateSettings />
                </TabPanel>
                
                <TabPanel>
                  <Box p={4}>
                    <Heading size="md" mb={4}>界面设置</Heading>
                    <Divider my={4} />
                    <Box>界面设置功能正在开发中...</Box>
                  </Box>
                </TabPanel>
                
                <TabPanel>
                  <Box p={4}>
                    <Heading size="md" mb={4}>账户设置</Heading>
                    <Divider my={4} />
                    <Box>账户设置功能正在开发中...</Box>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SettingsPanel; 