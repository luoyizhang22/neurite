import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

// 定义类型
interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  contextNodes?: string[]; // 关联的节点ID
}

interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  graphId?: string; // 关联的图谱ID
}

interface AIState {
  conversations: Record<string, AIConversation>;
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: AIState = {
  conversations: {},
  currentConversationId: null,
  isLoading: false,
  error: null,
};

// 异步请求 - 发送消息
export const sendMessage = createAsyncThunk(
  'ai/sendMessage',
  async (
    {
      message,
      conversationId,
      contextNodes = [],
    }: {
      message: string;
      conversationId: string;
      contextNodes?: string[];
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { ai: AIState };
      const conversation = state.ai.conversations[conversationId];

      if (!conversation) {
        return rejectWithValue('会话不存在');
      }

      // 构建历史消息上下文
      const history = conversation.messages.map(({ role, content }) => ({ role, content }));

      // 模拟API调用
      // 实际项目中，这里应该调用OpenAI API或其他AI服务
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟AI响应
      return {
        conversationId,
        message: {
          id: nanoid(),
          role: 'assistant' as const,
          content: `这是对"${message}"的模拟AI回复。在实际应用中，这里会调用OpenAI或其他AI服务的API。`,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return rejectWithValue('发送消息失败: ' + error);
    }
  }
);

// 创建AI slice
const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    // 创建新对话
    createConversation: {
      reducer: (state, action: PayloadAction<AIConversation>) => {
        state.conversations[action.payload.id] = action.payload;
        state.currentConversationId = action.payload.id;
      },
      prepare: (params?: Partial<AIConversation>) => {
        const id = nanoid();
        return {
          payload: {
            id,
            title: params?.title || `新对话 ${new Date().toLocaleString()}`,
            messages: params?.messages || [],
            graphId: params?.graphId,
          },
        };
      },
    },

    // 设置当前对话
    setCurrentConversation: (state, action: PayloadAction<string>) => {
      if (state.conversations[action.payload]) {
        state.currentConversationId = action.payload;
      }
    },

    // 添加用户消息
    addUserMessage: (
      state,
      action: PayloadAction<{
        conversationId: string;
        content: string;
        contextNodes?: string[];
      }>
    ) => {
      const { conversationId, content, contextNodes } = action.payload;
      
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages.push({
          id: nanoid(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
          contextNodes,
        });
      }
    },

    // 更新对话标题
    updateConversationTitle: (
      state,
      action: PayloadAction<{ conversationId: string; title: string }>
    ) => {
      const { conversationId, title } = action.payload;
      
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].title = title;
      }
    },

    // 删除对话
    deleteConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      
      if (state.conversations[conversationId]) {
        delete state.conversations[conversationId];
        
        if (state.currentConversationId === conversationId) {
          // 设置新的当前对话（如果有的话）
          const conversationIds = Object.keys(state.conversations);
          state.currentConversationId = conversationIds.length > 0 ? conversationIds[0] : null;
        }
      }
    },

    // 清空所有对话
    clearAllConversations: (state) => {
      state.conversations = {};
      state.currentConversationId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 处理发送消息
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, message } = action.payload;
        
        if (state.conversations[conversationId]) {
          state.conversations[conversationId].messages.push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出actions
export const {
  createConversation,
  setCurrentConversation,
  addUserMessage,
  updateConversationTitle,
  deleteConversation,
  clearAllConversations,
} = aiSlice.actions;

// 导出reducer
export default aiSlice.reducer; 