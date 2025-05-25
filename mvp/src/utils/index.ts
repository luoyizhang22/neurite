/**
 * 工具函数索引文件
 * 导出所有工具函数，方便在项目中引用
 */

// 导出仿生阅读工具函数
export * from './bionicReading';

// 导出本地存储工具函数
export * from './localStorage';

/**
 * 生成唯一ID
 * @param prefix ID前缀
 * @returns 唯一ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('DD', day.toString().padStart(2, '0'))
    .replace('HH', hours.toString().padStart(2, '0'))
    .replace('mm', minutes.toString().padStart(2, '0'))
    .replace('ss', seconds.toString().padStart(2, '0'));
}

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param func 要执行的函数
 * @param limit 限制时间（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  // 处理普通对象
  const clonedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * Extract keywords from text
 * @param text Text content
 * @param maxKeywords Maximum number of keywords
 * @returns Array of keywords
 */
export function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  if (!text) return [];
  
  // Remove common stop words
  const stopWords = new Set([
    '的', '了', '和', '是', '在', '我', '有', '这', '个', '你', '们', '他', '她', '它',
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
    'to', 'of', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'as', 'at',
    'this', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'he', 'will', 'my', 'one',
    'all', 'would', 'there', 'their'
  ]);
  
  // Tokenize and count
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // Keep letters, numbers, underscores, spaces, and Chinese characters
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word)); // Filter out stop words and single characters
  
  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency and return top N
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * 计算两个字符串的相似度（Levenshtein距离）
 * @param str1 第一个字符串
 * @param str2 第二个字符串
 * @returns 相似度（0-1之间，1表示完全相同）
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  // 创建距离矩阵
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(null));
  
  // 初始化第一行和第一列
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // 填充矩阵
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 删除
        matrix[i][j - 1] + 1, // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }
  
  // 计算相似度
  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return 1 - distance / maxLength;
} 