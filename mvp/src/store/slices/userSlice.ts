import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser, IUserPreferences, DEFAULT_USER_PREFERENCES } from '../../types/user';

interface UserState {
  currentUser: IUser | null;
  preferences: IUserPreferences;
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: UserState = {
  currentUser: null,
  preferences: DEFAULT_USER_PREFERENCES,
  isLoading: false,
  error: null
};

// 尝试从localStorage加载用户偏好设置
try {
  const savedPreferences = localStorage.getItem('userPreferences');
  if (savedPreferences) {
    initialState.preferences = {
      ...DEFAULT_USER_PREFERENCES,
      ...JSON.parse(savedPreferences)
    };
  }
} catch (error) {
  console.error('Failed to load user preferences from localStorage:', error);
}

// 创建Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 登录相关
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<IUser>) {
      state.currentUser = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.currentUser = null;
    },
    
    // 用户偏好设置相关
    updateUserPreferences(state, action: PayloadAction<Partial<IUserPreferences>>) {
      state.preferences = {
        ...state.preferences,
        ...action.payload
      };
      
      // 保存到localStorage
      try {
        localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
      } catch (error) {
        console.error('Failed to save user preferences to localStorage:', error);
      }
    }
  }
});

// 导出actions
export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout,
  updateUserPreferences
} = userSlice.actions;

// 导出reducer
export default userSlice.reducer; 