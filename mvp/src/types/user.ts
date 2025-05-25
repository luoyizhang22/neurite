/**
 * 定义用户相关的类型
 */

// 用户类型
export interface IUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  preferences: IUserPreferences;
  stats: IUserStats;
}

// 用户偏好设置类型
export interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  bionicReadingEnabled: boolean;
  autoSaveInterval: number; // 秒
  defaultGraphLayout: 'force' | 'tree' | 'radial';
  defaultAIModel: string;
  defaultAITemperature: number;
  notificationsEnabled: boolean;
  tutorialCompleted: boolean;
  customPromptTemplates: {
    [key in AnalysisType]?: string;
  };
  useCustomPrompts: boolean;
}

// 用户统计信息类型
export interface IUserStats {
  totalGraphs: number;
  totalNodes: number;
  totalAIInteractions: number;
  lastActiveGraphId?: string;
  recentGraphIds: string[];
  starredGraphIds: string[];
  createdAt: string;
  updatedAt: string;
}

// 用户活动类型
export interface IUserActivity {
  id: string;
  userId: string;
  type: 'create_graph' | 'edit_graph' | 'delete_graph' | 'create_node' | 'edit_node' | 'delete_node' | 'ai_interaction';
  timestamp: string;
  metadata: {
    graphId?: string;
    nodeId?: string;
    details?: string;
  };
}

// 用户认证状态类型
export interface IAuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
}

// 登录请求类型
export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// 注册请求类型
export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

// 用户响应类型
export interface IUserResponse {
  user: IUser;
  token: string;
}

// 从PromptBuilder导入分析类型
import { AnalysisType } from '../api/PromptBuilder';

// 默认用户偏好设置
export const DEFAULT_USER_PREFERENCES: IUserPreferences = {
  theme: 'system',
  language: 'zh-CN',
  bionicReadingEnabled: true,
  autoSaveInterval: 30,
  defaultGraphLayout: 'force',
  defaultAIModel: 'gpt-3.5-turbo',
  defaultAITemperature: 0.7,
  notificationsEnabled: true,
  tutorialCompleted: false,
  customPromptTemplates: {},
  useCustomPrompts: false
}; 