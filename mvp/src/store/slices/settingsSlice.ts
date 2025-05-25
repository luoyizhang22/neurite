import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义设置状态类型
interface SettingsState {
  // 用户相关
  username: string;
  
  // AI相关
  apiKey: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  
  // 界面相关
  bionicReadingEnabled: boolean;
  autoSaveInterval: number;
  graphLayoutAlgorithm: 'force' | 'tree' | 'radial';
  theme: 'light' | 'dark' | 'system';
  
  // 存储相关
  localStorageEnabled: boolean;
  cloudSyncEnabled: boolean;
}

// 初始状态
const initialState: SettingsState = {
  username: '用户',
  
  apiKey: '',
  defaultModel: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  
  bionicReadingEnabled: true,
  autoSaveInterval: 30, // 秒
  graphLayoutAlgorithm: 'force',
  theme: 'system',
  
  localStorageEnabled: true,
  cloudSyncEnabled: false,
};

// 从本地存储中读取设置
const loadSettings = (): Partial<SettingsState> => {
  try {
    const savedSettings = localStorage.getItem('neurite-storm-settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
  return {};
};

// 创建设置slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    ...initialState,
    ...loadSettings(), // 合并存储的设置
  },
  reducers: {
    // 更新单个设置
    updateSetting: <K extends keyof SettingsState>(
      state,
      action: PayloadAction<{ key: K; value: SettingsState[K] }>
    ) => {
      const { key, value } = action.payload;
      state[key] = value;
      
      // 保存到本地存储
      try {
        localStorage.setItem('neurite-storm-settings', JSON.stringify(state));
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },
    
    // 更新多个设置
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      Object.assign(state, action.payload);
      
      // 保存到本地存储
      try {
        localStorage.setItem('neurite-storm-settings', JSON.stringify(state));
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },
    
    // 重置所有设置
    resetSettings: (state) => {
      Object.assign(state, initialState);
      
      // 清除本地存储
      try {
        localStorage.removeItem('neurite-storm-settings');
      } catch (error) {
        console.error('清除设置失败:', error);
      }
    },
    
    // 导入设置
    importSettings: (state, action: PayloadAction<SettingsState>) => {
      Object.assign(state, action.payload);
      
      // 保存到本地存储
      try {
        localStorage.setItem('neurite-storm-settings', JSON.stringify(state));
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },
  },
});

// 导出actions
export const { updateSetting, updateSettings, resetSettings, importSettings } =
  settingsSlice.actions;

// 导出reducer
export default settingsSlice.reducer; 