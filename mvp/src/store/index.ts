import { configureStore } from '@reduxjs/toolkit';
import graphsReducer from './slices/graphsSlice';
import nodesReducer from './slices/nodesSlice';
import settingsReducer from './slices/settingsSlice';
import aiReducer from './slices/aiSlice';
import userReducer from './slices/userSlice';

// 配置Redux存储
export const store = configureStore({
  reducer: {
    graphs: graphsReducer,
    nodes: nodesReducer,
    settings: settingsReducer,
    ai: aiReducer,
    user: userReducer,
  },
  // 启用Redux DevTools
  devTools: process.env.NODE_ENV !== 'production',
});

// 从store本身导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 