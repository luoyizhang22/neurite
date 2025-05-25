import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import { IGraph, INode, IViewport } from '@/types/graph';

// 定义状态类型
interface GraphsState {
  graphs: IGraph[];
  recentGraphs: IGraph[];
  starredGraphs: IGraph[];
  currentGraph: IGraph | null;
  activeNode: string | null;
  selectedNodes: string[];
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: GraphsState = {
  graphs: [
    {
      id: '1',
      title: '思考未来教育',
      description: '关于教育未来发展的思维导图',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      starred: true,
    },
    {
      id: '2',
      title: '软件架构分析',
      description: '系统架构设计与分析',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      starred: false,
    },
    {
      id: '3',
      title: '产品规划',
      description: '2025年产品路线图',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      starred: true,
    }
  ],
  recentGraphs: [
    {
      id: '1',
      title: '思考未来教育',
      description: '关于教育未来发展的思维导图',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      starred: true,
    },
    {
      id: '3',
      title: '产品规划',
      description: '2025年产品路线图',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      starred: true,
    }
  ],
  starredGraphs: [
    {
      id: '1',
      title: '思考未来教育',
      description: '关于教育未来发展的思维导图',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      starred: true,
    },
    {
      id: '3',
      title: '产品规划',
      description: '2025年产品路线图',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      starred: true,
    }
  ],
  currentGraph: null,
  activeNode: null,
  selectedNodes: [],
  isLoading: false,
  error: null,
};

// 异步操作：加载所有图谱
export const loadGraphs = createAsyncThunk(
  'graphs/loadGraphs',
  async (_, { rejectWithValue }) => {
    try {
      // 实际中应该从API或本地存储加载
      // 这里模拟一些测试数据
      return [
        {
          id: '1',
          title: '思考未来教育',
          description: '关于教育未来发展的思维导图',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          starred: true,
        },
        {
          id: '2',
          title: '软件架构分析',
          description: '探索不同软件架构模式的优缺点',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          starred: false,
        },
      ];
    } catch (error) {
      return rejectWithValue('加载图谱失败');
    }
  }
);

// 异步操作：加载最近图谱
export const loadRecentGraphs = createAsyncThunk(
  'graphs/loadRecentGraphs',
  async (_, { rejectWithValue }) => {
    try {
      // 实际应该根据访问时间排序并过滤
      // 这里简单模拟
      return [
        {
          id: '1',
          title: '思考未来教育',
          description: '关于教育未来发展的思维导图',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          starred: true,
        },
        {
          id: '2',
          title: '软件架构分析',
          description: '探索不同软件架构模式的优缺点',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          starred: false,
        },
      ];
    } catch (error) {
      return rejectWithValue('加载最近图谱失败');
    }
  }
);

// 异步操作：加载单个图谱
export const loadGraph = createAsyncThunk(
  'graphs/loadGraph',
  async (graphId: string, { rejectWithValue }) => {
    try {
      // 实际应该从API或本地存储加载具体图谱
      // 这里模拟测试数据
      return {
        id: graphId,
        title: '思考未来教育',
        description: '关于教育未来发展的思维导图',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          {
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
          {
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
          {
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
        ],
        edges: [
          {
            id: 'edge-1-2',
            source: 'node-1',
            target: 'node-2',
            type: 'direct',
          },
          {
            id: 'edge-1-3',
            source: 'node-1',
            target: 'node-3',
            type: 'direct',
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
        starred: true,
      };
    } catch (error) {
      return rejectWithValue(`加载图谱 ${graphId} 失败`);
    }
  }
);

// 创建图谱slice
const graphsSlice = createSlice({
  name: 'graphs',
  initialState,
  reducers: {
    // 创建新图谱
    createGraph: {
      reducer: (state, action: PayloadAction<IGraph>) => {
        state.graphs.push(action.payload);
        state.recentGraphs.unshift(action.payload);
        state.currentGraph = action.payload;
      },
      prepare: (graph: Partial<IGraph>) => {
        const now = new Date().toISOString();
        return {
          payload: {
            id: nanoid(),
            title: graph.title || '新图谱',
            description: graph.description || '',
            createdAt: now,
            updatedAt: now,
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            starred: false,
            ...graph,
          },
        };
      },
    },
    
    // 更新图谱
    updateGraph: (state, action: PayloadAction<Partial<IGraph> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const graphIndex = state.graphs.findIndex((g) => g.id === id);
      
      if (graphIndex !== -1) {
        state.graphs[graphIndex] = {
          ...state.graphs[graphIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        // 如果是当前图谱，也更新当前图谱
        if (state.currentGraph?.id === id) {
          state.currentGraph = {
            ...state.currentGraph,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        
        // 更新最近图谱列表
        const recentIndex = state.recentGraphs.findIndex((g) => g.id === id);
        if (recentIndex !== -1) {
          state.recentGraphs[recentIndex] = {
            ...state.recentGraphs[recentIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        
        // 更新收藏图谱列表
        const starredIndex = state.starredGraphs.findIndex((g) => g.id === id);
        if (updates.starred !== undefined) {
          if (updates.starred && starredIndex === -1) {
            state.starredGraphs.push(state.graphs[graphIndex]);
          } else if (!updates.starred && starredIndex !== -1) {
            state.starredGraphs.splice(starredIndex, 1);
          }
        } else if (starredIndex !== -1) {
          state.starredGraphs[starredIndex] = {
            ...state.starredGraphs[starredIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    },
    
    // 删除图谱
    deleteGraph: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.graphs = state.graphs.filter((g) => g.id !== id);
      state.recentGraphs = state.recentGraphs.filter((g) => g.id !== id);
      state.starredGraphs = state.starredGraphs.filter((g) => g.id !== id);
      
      if (state.currentGraph?.id === id) {
        state.currentGraph = null;
      }
    },
    
    // 更新视图位置
    updateGraphViewport: (
      state,
      action: PayloadAction<{ graphId: string; viewport: IViewport }>
    ) => {
      const { graphId, viewport } = action.payload;
      
      if (state.currentGraph?.id === graphId) {
        state.currentGraph.viewport = viewport;
      }
      
      const graphIndex = state.graphs.findIndex((g) => g.id === graphId);
      if (graphIndex !== -1) {
        state.graphs[graphIndex].viewport = viewport;
      }
    },
    
    // 设置活动节点
    setActiveNode: (state, action: PayloadAction<string | null>) => {
      state.activeNode = action.payload;
    },
    
    // 设置选中的节点
    setSelectedNodes: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload;
    },
    
    // 切换收藏状态
    toggleStarred: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const graphIndex = state.graphs.findIndex((g) => g.id === id);
      
      if (graphIndex !== -1) {
        const isStarred = !state.graphs[graphIndex].starred;
        state.graphs[graphIndex].starred = isStarred;
        
        if (state.currentGraph?.id === id) {
          state.currentGraph.starred = isStarred;
        }
        
        if (isStarred) {
          state.starredGraphs.push(state.graphs[graphIndex]);
        } else {
          state.starredGraphs = state.starredGraphs.filter((g) => g.id !== id);
        }
      }
    },
  },
  extraReducers: (builder) => {
    // 处理加载所有图谱
    builder
      .addCase(loadGraphs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGraphs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.graphs = action.payload;
        state.error = null;
      })
      .addCase(loadGraphs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 处理加载最近图谱
    builder
      .addCase(loadRecentGraphs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadRecentGraphs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentGraphs = action.payload;
        state.starredGraphs = action.payload.filter((g) => g.starred);
        state.error = null;
      })
      .addCase(loadRecentGraphs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 处理加载单个图谱
    builder
      .addCase(loadGraph.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGraph.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGraph = action.payload;
        state.error = null;
        
        // 更新最近访问列表
        const existingIndex = state.recentGraphs.findIndex(
          (g) => g.id === action.payload.id
        );
        
        if (existingIndex !== -1) {
          // 移到最前面
          const [graph] = state.recentGraphs.splice(existingIndex, 1);
          state.recentGraphs.unshift(graph);
        } else if (state.graphs.find((g) => g.id === action.payload.id)) {
          // 如果图谱存在于全部图谱中但不在最近访问列表中，添加到最近访问
          state.recentGraphs.unshift(action.payload);
        }
      })
      .addCase(loadGraph.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出actions
export const {
  createGraph,
  updateGraph,
  deleteGraph,
  updateGraphViewport,
  setActiveNode,
  setSelectedNodes,
  toggleStarred,
} = graphsSlice.actions;

// 导出reducer
export default graphsSlice.reducer; 