import React from 'react';
import { Box, Text, Link, OrderedList, UnorderedList, ListItem, Code, Heading } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

interface ChakraMarkdownProps {
  children: React.ReactNode;
}

export const ChakraMarkdown: React.FC<ChakraMarkdownProps> = ({ children }) => {
  const components = {
    h1: (props: any) => <Heading as="h1" size="xl" my={4} {...props} />,
    h2: (props: any) => <Heading as="h2" size="lg" my={3} {...props} />,
    h3: (props: any) => <Heading as="h3" size="md" my={2} {...props} />,
    h4: (props: any) => <Heading as="h4" size="sm" my={2} {...props} />,
    p: (props: any) => <Text my={2} {...props} />,
    a: (props: any) => <Link color="blue.500" isExternal {...props} />,
    ul: (props: any) => <UnorderedList pl={4} my={2} {...props} />,
    ol: (props: any) => <OrderedList pl={4} my={2} {...props} />,
    li: (props: any) => <ListItem {...props} />,
    code: (props: any) => <Code p={2} {...props} />,
    pre: (props: any) => (
      <Box
        as="pre"
        p={4}
        borderRadius="md"
        bg="gray.700"
        color="white"
        overflowX="auto"
        my={4}
        {...props}
      />
    ),
  };

  return <>{children}</>;
}; 