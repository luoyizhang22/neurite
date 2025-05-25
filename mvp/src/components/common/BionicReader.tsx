import React, { useMemo } from 'react';
import { Box, Text, BoxProps, useColorModeValue } from '@chakra-ui/react';

interface BionicReaderProps extends BoxProps {
  /**
   * 要转换为仿生阅读格式的文本
   */
  text: string;
  
  /**
   * 高亮比例 - 每个单词高亮的比例 (0.1 到 0.7)
   * 默认值: 0.4
   */
  highlightRatio?: number;
  
  /**
   * 显示的格式
   * 'paragraph' - 普通段落 (默认)
   * 'columns' - 分栏布局
   */
  layout?: 'paragraph' | 'columns';
  
  /**
   * 分栏数 (只在 layout='columns' 时生效)
   */
  columnCount?: number;
}

/**
 * 仿生阅读组件 - 提高文本可读性
 * 
 * 仿生阅读(Bionic Reading)是一种通过高亮单词的前半部分来提高阅读速度和理解力的技术。
 * 这种方法基于人脑识别单词轮廓的能力，减少了阅读时的认知负担。
 */
const BionicReader: React.FC<BionicReaderProps> = ({
  text,
  highlightRatio = 0.4,
  layout = 'paragraph',
  columnCount = 2,
  ...boxProps
}) => {
  // 限制高亮比例在有效范围内
  const ratio = Math.min(Math.max(highlightRatio, 0.1), 0.7);
  
  // 文本颜色
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const highlightColor = useColorModeValue('black', 'white');
  const highlightWeight = 'bold';
  
  // 处理文本，将每个单词的前部分加粗
  const processedText = useMemo(() => {
    // 将文本分割为段落
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, pIndex) => {
      // 将每个段落分割为单词
      const words = paragraph.split(/(\s+)/);
      
      // 处理每个单词
      const processedWords = words.map((word, wIndex) => {
        // 跳过空格
        if (word.trim() === '') {
          return <span key={`${pIndex}-${wIndex}-space`}>{word}</span>;
        }
        
        // 计算高亮部分的长度
        const highlightLength = Math.ceil(word.length * ratio);
        
        // 分割单词的高亮部分和普通部分
        const highlight = word.substring(0, highlightLength);
        const rest = word.substring(highlightLength);
        
        return (
          <Text as="span" key={`${pIndex}-${wIndex}-word`} display="inline">
            <Text 
              as="span" 
              fontWeight={highlightWeight} 
              color={highlightColor}
            >
              {highlight}
            </Text>
            <Text as="span" color={textColor}>
              {rest}
            </Text>
          </Text>
        );
      });
      
      // 将处理后的单词组合回段落
      return (
        <Text 
          key={`paragraph-${pIndex}`} 
          mb={4}
          lineHeight="taller"
        >
          {processedWords}
        </Text>
      );
    });
  }, [text, ratio, textColor, highlightColor]);
  
  return (
    <Box
      {...boxProps}
      sx={layout === 'columns' ? {
        columnCount: columnCount,
        columnGap: '2rem',
        columnRule: '1px solid',
        columnRuleColor: 'gray.200',
      } : {}}
    >
      {processedText}
    </Box>
  );
};

export default BionicReader; 