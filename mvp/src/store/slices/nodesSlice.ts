import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import { INode } from '@/types/graph';

// 定义状态类型
interface NodesState {
  nodes: Record<string, INode>;
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: NodesState = {
  nodes: {},
  isLoading: false,
  error: null,
};

// 异步操作：加载指定图谱的节点
export const loadNodes = createAsyncThunk(
  'nodes/loadNodes',
  async (graphId: string, { rejectWithValue }) => {
    try {
      // 实际应该从API或本地存储加载
      // 这里返回模拟数据
      return {
        'node-1': {
          id: 'node-1',
          type: 'text',
          position: { x: 100, y: 100 },
          data: {
            content: '未来教育的核心挑战',
            format: 'plain',
          },
          connectedTo: ['node-2', 'node-3'],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: ['教育', '挑战'],
          },
        },
        'node-2': {
          id: 'node-2',
          type: 'text',
          position: { x: 300, y: 50 },
          data: {
            content: '技术整合',
            format: 'plain',
          },
          connectedTo: ['node-1'],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: ['技术', '教育'],
          },
        },
        'node-3': {
          id: 'node-3',
          type: 'text',
          position: { x: 300, y: 150 },
          data: {
            content: '个性化学习',
            format: 'plain',
          },
          connectedTo: ['node-1'],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: ['个性化', '学习'],
          },
        },
      };
    } catch (error) {
      return rejectWithValue(`加载图谱 ${graphId} 的节点失败`);
    }
  }
);

// 创建节点slice
const nodesSlice = createSlice({
  name: 'nodes',
  initialState,
  reducers: {
    // 添加节点
    addNode: {
      reducer: (state, action: PayloadAction<INode>) => {
        state.nodes[action.payload.id] = action.payload;
      },
      prepare: (node: Partial<INode>) => {
        const now = new Date();
        return {
          payload: {
            id: node.id || nanoid(),
            type: node.type || 'text',
            position: node.position || { x: 0, y: 0 },
            data: node.data || { content: '', format: 'plain' },
            connectedTo: node.connectedTo || [],
            metadata: {
              createdAt: now,
              updatedAt: now,
              tags: [],
              ...node.metadata,
            },
          },
        };
      },
    },
    
    // 更新节点
    updateNode: (state, action: PayloadAction<Partial<INode> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      
      if (state.nodes[id]) {
        state.nodes[id] = {
          ...state.nodes[id],
          ...updates,
          metadata: {
            ...state.nodes[id].metadata,
            updatedAt: new Date(),
            ...(updates.metadata || {}),
          },
        };
      }
    },
    
    // 更新节点位置
    updateNodePosition: (
      state,
      action: PayloadAction<{ id: string; position: { x: number; y: number } }>
    ) => {
      const { id, position } = action.payload;
      
      if (state.nodes[id]) {
        state.nodes[id].position = position;
        state.nodes[id].metadata.updatedAt = new Date();
      }
    },
    
    // 删除节点
    deleteNode: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      
      // 删除所有连接到此节点的引用
      Object.values(state.nodes).forEach((node) => {
        if (node.connectedTo.includes(id)) {
          node.connectedTo = node.connectedTo.filter((connId) => connId !== id);
        }
      });
      
      // 删除节点本身
      delete state.nodes[id];
    },
    
    // 连接节点
    connectNodes: (
      state,
      action: PayloadAction<{ sourceId: string; targetId: string }>
    ) => {
      const { sourceId, targetId } = action.payload;
      
      if (state.nodes[sourceId] && state.nodes[targetId]) {
        // 确保不重复添加
        if (!state.nodes[sourceId].connectedTo.includes(targetId)) {
          state.nodes[sourceId].connectedTo.push(targetId);
          state.nodes[sourceId].metadata.updatedAt = new Date();
        }
      }
    },
    
    // 断开节点连接
    disconnectNodes: (
      state,
      action: PayloadAction<{ sourceId: string; targetId: string }>
    ) => {
      const { sourceId, targetId } = action.payload;
      
      if (state.nodes[sourceId]) {
        state.nodes[sourceId].connectedTo = state.nodes[sourceId].connectedTo.filter(
          (id) => id !== targetId
        );
        state.nodes[sourceId].metadata.updatedAt = new Date();
      }
    },
    
    // 清空所有节点
    clearNodes: (state) => {
      state.nodes = {};
    },
  },
  extraReducers: (builder) => {
    // 处理加载节点
    builder
      .addCase(loadNodes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadNodes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nodes = action.payload;
        state.error = null;
      })
      .addCase(loadNodes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出actions
export const {
  addNode,
  updateNode,
  updateNodePosition,
  deleteNode,
  connectNodes,
  disconnectNodes,
  clearNodes,
} = nodesSlice.actions;

// 导出reducer
export default nodesSlice.reducer; 