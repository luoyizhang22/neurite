/**
 * Bionic Reading Utility Functions
 * 
 * Bionic reading is a technique that improves reading speed and comprehension 
 * by bolding the first part of each word.
 * This utility function converts plain text to bionic reading format.
 */

/**
 * Converts text to bionic reading format
 * @param text Text to convert
 * @param boldRatio Bolding ratio, default is 0.5 (half of each word)
 * @returns HTML string with bionic formatting
 */
export function convertToBionicReading(text: string, boldRatio: number = 0.5): string {
  // If text is empty, return immediately
  if (!text) return '';
  
  // Split text into words by spaces and punctuation
  const words = text.split(/(\s+|[,.!?;:()[\]{}'"«»""''—–-])/g);
  
  // Process each word
  const bionicWords = words.map(word => {
    // Skip spaces and punctuation
    if (!word.trim() || /^[\s,.!?;:()[\]{}'"«»""''—–-]+$/.test(word)) {
      return word;
    }
    
    // Calculate number of characters to bold
    const boldLength = Math.max(1, Math.ceil(word.length * boldRatio));
    
    // Split word into bold part and normal part
    const boldPart = word.substring(0, boldLength);
    const normalPart = word.substring(boldLength);
    
    // Return bolded word
    return `<strong>${boldPart}</strong>${normalPart}`;
  });
  
  // Combine processed words back into text
  return bionicWords.join('');
}

/**
 * Converts Markdown text to bionic reading format
 * Preserves Markdown syntax, applies bionic reading format only to plain text
 * @param markdown Markdown text
 * @param boldRatio Bolding ratio, default is 0.5
 * @returns Converted Markdown text
 */
export function convertMarkdownToBionicReading(markdown: string, boldRatio: number = 0.5): string {
  if (!markdown) return '';
  
  // Define regular expressions to match Markdown elements
  const codeBlockRegex = /```[\s\S]*?```/g;
  const inlineCodeRegex = /`[^`]*`/g;
  const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
  const imageRegex = /!\[([^\]]*)\]\([^)]+\)/g;
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const listItemRegex = /^(\s*[-*+]|\s*\d+\.)\s+(.+)$/gm;
  const boldItalicRegex = /(\*\*\*|___)(.*?)\1/g;
  const boldRegex = /(\*\*|__)(.*?)\1/g;
  const italicRegex = /(\*|_)(.*?)\1/g;
  
  // Store elements to preserve
  const placeholders: { [key: string]: string } = {};
  let placeholderIndex = 0;
  
  // Replacer function, replaces matched elements with placeholders
  const replacer = (match: string): string => {
    const placeholder = `__BIONIC_PLACEHOLDER_${placeholderIndex}__`;
    placeholders[placeholder] = match;
    placeholderIndex++;
    return placeholder;
  };
  
  // Replace all Markdown elements to preserve
  let processedText = markdown
    .replace(codeBlockRegex, replacer)
    .replace(inlineCodeRegex, replacer)
    .replace(imageRegex, replacer);
  
  // Process link text
  processedText = processedText.replace(linkRegex, (match, text) => {
    const bionicText = convertToBionicReading(text, boldRatio);
    const placeholder = `__BIONIC_PLACEHOLDER_${placeholderIndex}__`;
    placeholders[placeholder] = match.replace(text, bionicText);
    placeholderIndex++;
    return placeholder;
  });
  
  // Process heading text
  processedText = processedText.replace(headingRegex, (match, hashes, text) => {
    const bionicText = convertToBionicReading(text, boldRatio);
    return `${hashes} ${bionicText}`;
  });
  
  // Process list item text
  processedText = processedText.replace(listItemRegex, (match, bullet, text) => {
    const bionicText = convertToBionicReading(text, boldRatio);
    return `${bullet} ${bionicText}`;
  });
  
  // Process bold italic text
  processedText = processedText.replace(boldItalicRegex, (match, wrapper, text) => {
    const bionicText = convertToBionicReading(text, boldRatio);
    return `${wrapper}${bionicText}${wrapper}`;
  });
  
  // Process bold text
  processedText = processedText.replace(boldRegex, (match, wrapper, text) => {
    const bionicText = convertToBionicReading(text, boldRatio);
    return `${wrapper}${bionicText}${wrapper}`;
  });
  
  // Process italic text
  processedText = processedText.replace(italicRegex, (match, wrapper, text) => {
    const bionicText = convertToBionicReading(text, boldRatio);
    return `${wrapper}${bionicText}${wrapper}`;
  });
  
  // Process remaining plain text
  const lines = processedText.split('\n');
  const bionicLines = lines.map(line => {
    // Skip already processed lines (placeholders, headings, list items, etc.)
    if (line.includes('__BIONIC_PLACEHOLDER_') || 
        /^#{1,6}\s+/.test(line) || 
        /^(\s*[-*+]|\s*\d+\.)\s+/.test(line) ||
        /^(\s*)$/.test(line)) {
      return line;
    }
    return convertToBionicReading(line, boldRatio);
  });
  
  let result = bionicLines.join('\n');
  
  // Restore all placeholders
  Object.keys(placeholders).forEach(placeholder => {
    result = result.replace(placeholder, placeholders[placeholder]);
  });
  
  return result;
}

/**
 * Converts HTML text to bionic reading format
 * Preserves HTML tags, applies bionic reading format only to text content
 * @param html HTML text
 * @param boldRatio Bolding ratio, default is 0.5
 * @returns Converted HTML text
 */
export function convertHtmlToBionicReading(html: string, boldRatio: number = 0.5): string {
  if (!html) return '';
  
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Recursively process all text nodes
  const processNode = (node: Node): void => {
    // If it's a text node, apply bionic reading format
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const bionicText = convertToBionicReading(node.textContent, boldRatio);
      const tempSpan = document.createElement('span');
      tempSpan.innerHTML = bionicText;
      
      // Replace original node with processed node
      const fragment = document.createDocumentFragment();
      while (tempSpan.firstChild) {
        fragment.appendChild(tempSpan.firstChild);
      }
      node.parentNode?.replaceChild(fragment, node);
    } 
    // If it's an element node, recursively process its child nodes
    else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip elements already containing <strong> tags or code elements
      const tagName = (node as Element).tagName.toLowerCase();
      if (tagName === 'strong' || tagName === 'code' || tagName === 'pre') {
        return;
      }
      
      // Process child nodes (create a copy, because node list changes during processing)
      const childNodes = Array.from(node.childNodes);
      childNodes.forEach(processNode);
    }
  };
  
  // Process all child nodes
  Array.from(tempDiv.childNodes).forEach(processNode);
  
  return tempDiv.innerHTML;
}

/**
 * Checks if text is already in bionic reading format
 * @param text Text to check
 * @returns Whether text is already in bionic reading format
 */
export function isBionicReading(text: string): boolean {
  // Check if text contains <strong> tags
  return /<strong>.*?<\/strong>/.test(text);
}

/**
 * Removes bionic reading format from text
 * @param text Bionic reading format text
 * @returns Plain text
 */
export function removeBionicReading(text: string): string {
  if (!text) return '';
  
  // Remove <strong> tags, keep content
  return text.replace(/<strong>(.*?)<\/strong>/g, '$1');
} 