/**
 * 本地存储工具函数
 * 
 * 提供对localStorage的封装，支持存储和读取各种类型的数据，
 * 包括对象、数组等复杂数据类型，并提供过期时间设置。
 */

// 存储项的类型定义
interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number; // 过期时间（毫秒）
}

// 存储键前缀
const STORAGE_PREFIX = 'neurite-storm-';

/**
 * 将数据存储到localStorage
 * @param key 存储键
 * @param value 要存储的数据
 * @param expiryMs 过期时间（毫秒），可选
 */
export function setItem<T>(key: string, value: T, expiryMs?: number): void {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    
    localStorage.setItem(prefixedKey, JSON.stringify(item));
  } catch (error) {
    console.error(`存储数据失败 [${key}]:`, error);
  }
}

/**
 * 从localStorage获取数据
 * @param key 存储键
 * @param defaultValue 默认值，当数据不存在或已过期时返回
 * @returns 存储的数据或默认值
 */
export function getItem<T>(key: string, defaultValue?: T): T | undefined {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const storedItem = localStorage.getItem(prefixedKey);
    
    if (!storedItem) {
      return defaultValue;
    }
    
    const item: StorageItem<T> = JSON.parse(storedItem);
    
    // 检查是否过期
    if (item.expiry && Date.now() - item.timestamp > item.expiry) {
      // 数据已过期，删除并返回默认值
      localStorage.removeItem(prefixedKey);
      return defaultValue;
    }
    
    return item.value;
  } catch (error) {
    console.error(`读取数据失败 [${key}]:`, error);
    return defaultValue;
  }
}

/**
 * 从localStorage删除数据
 * @param key 存储键
 */
export function removeItem(key: string): void {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    localStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error(`删除数据失败 [${key}]:`, error);
  }
}

/**
 * 清除所有Neurite Storm相关的localStorage数据
 */
export function clearAll(): void {
  try {
    // 获取所有localStorage键
    const keys = Object.keys(localStorage);
    
    // 删除所有以前缀开头的键
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('清除所有数据失败:', error);
  }
}

/**
 * 获取所有Neurite Storm相关的localStorage数据
 * @returns 所有存储的数据对象
 */
export function getAllItems(): Record<string, any> {
  try {
    const result: Record<string, any> = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const shortKey = key.substring(STORAGE_PREFIX.length);
        const item = getItem(shortKey);
        if (item !== undefined) {
          result[shortKey] = item;
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('获取所有数据失败:', error);
    return {};
  }
}

/**
 * 检查localStorage是否可用
 * @returns localStorage是否可用
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = STORAGE_PREFIX + 'test';
    localStorage.setItem(testKey, 'test');
    const result = localStorage.getItem(testKey) === 'test';
    localStorage.removeItem(testKey);
    return result;
  } catch (error) {
    return false;
  }
}

/**
 * 获取localStorage已使用空间（字节）
 * @returns 已使用空间（字节）
 */
export function getStorageUsage(): number {
  try {
    let total = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key) || '';
        total += key.length + value.length;
      }
    });
    
    return total * 2; // UTF-16编码，每个字符占2字节
  } catch (error) {
    console.error('获取存储使用量失败:', error);
    return 0;
  }
}

/**
 * 导出所有Neurite Storm数据为JSON字符串
 * @returns JSON字符串
 */
export function exportData(): string {
  const data = getAllItems();
  return JSON.stringify(data);
}

/**
 * 从JSON字符串导入数据
 * @param jsonData JSON字符串
 * @param overwrite 是否覆盖现有数据
 * @returns 是否导入成功
 */
export function importData(jsonData: string, overwrite: boolean = false): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    if (overwrite) {
      // 清除现有数据
      clearAll();
    }
    
    // 导入数据
    Object.entries(data).forEach(([key, value]) => {
      setItem(key, value);
    });
    
    return true;
  } catch (error) {
    console.error('导入数据失败:', error);
    return false;
  }
} 