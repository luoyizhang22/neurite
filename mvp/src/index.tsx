import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import './styles/global.css';
// Import i18n configuration - must be imported before App
import './i18n';

// Extend Chakra UI theme
const theme = extendTheme({
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  colors: {
    brand: {
      50: '#e9e4ff',
      100: '#c5b9ff',
      200: '#a18eff',
      300: '#7d63fe',
      400: '#5938fe',
      500: '#401ffe',
      600: '#3317e6',
      700: '#2612cc',
      800: '#190cb3',
      900: '#0b0799',
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
});

// Create root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = ReactDOM.createRoot(rootElement);

// Render application
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ChakraProvider theme={theme}>
          <App />
        </ChakraProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
); 