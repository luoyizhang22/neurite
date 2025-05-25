/**
 * 类型索引文件
 * 导出所有类型定义，方便在项目中引用
 */

// 导出图谱相关类型
export * from './graph';

// 导出AI相关类型
export * from './ai';

// 导出用户相关类型
export * from './user';

// 导出Redux相关类型
export type RootState = {
  graphs: import('../store/slices/graphsSlice').GraphsState;
  nodes: import('../store/slices/nodesSlice').NodesState;
  settings: import('../store/slices/settingsSlice').SettingsState;
  ai: import('../store/slices/aiSlice').AIState;
};

export type AppDispatch = import('../store').AppDispatch; 