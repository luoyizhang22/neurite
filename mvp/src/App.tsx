import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Flex, useColorMode } from '@chakra-ui/react';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import GraphPage from './pages/GraphPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';
import SettingsPanel from './components/settings/SettingsPanel';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { store } from './store';
// Import i18n configuration
import './i18n';
import { useTranslation } from 'react-i18next';

// Use Chakra UI default theme or create a simple theme
const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  }
});

const App = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { t } = useTranslation();

  // Check system color preference and switch if needed
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (
      (prefersDarkMode && colorMode === 'light') ||
      (!prefersDarkMode && colorMode === 'dark')
    ) {
      toggleColorMode();
    }
  }, [colorMode, toggleColorMode]);

  return (
    <ChakraProvider theme={theme}>
      <Provider store={store}>
        <Box minH="100vh" bg={colorMode === 'dark' ? 'gray.800' : 'gray.50'}>
          <Flex direction="column" h="100vh">
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="graph/:graphId" element={<GraphPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="not-found" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/not-found" replace />} />
              </Route>
            </Routes>
            <Box position="absolute" top="4" right="4" zIndex="1000">
              <SettingsPanel />
            </Box>
          </Flex>
        </Box>
      </Provider>
    </ChakraProvider>
  );
};

export default App; 