import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DebateNode from '@components/nodes/DebateNode';
import { INode, IDebateNode } from '@types/graph';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

// 创建模拟Redux Store
const mockStore = configureStore([]);

describe('DebateNode Component', () => {
  let node: IDebateNode;
  let store: any;
  
  beforeEach(() => {
    // 初始化测试节点数据
    node = {
      id: 'debate-node-1',
      type: 'debate',
      position: { x: 100, y: 100 },
      data: {
        topic: '人工智能对教育的影响',
        perspectives: [
          {
            id: '1',
            title: '积极影响视角',
            content: '人工智能可以通过个性化学习和自适应教学提高教育效率。',
            type: 'positive'
          },
          {
            id: '2',
            title: '消极影响视角',
            content: '过度依赖AI可能减少人际互动和批判性思维训练。',
            type: 'negative'
          },
          {
            id: '3',
            title: '平衡视角',
            content: '将AI作为工具而非替代品，与传统教学方法结合使用。',
            type: 'neutral'
          }
        ],
        analysis: '对AI在教育中应用的多角度分析...',
        persuasiveView: '平衡视角在考虑教育的全面发展需求时最具说服力。',
        settings: {
          debateStyle: 'balanced',
          complexity: 'moderate',
          model: 'gpt-4'
        }
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    // 初始化Redux Store
    store = mockStore({
      nodes: {
        nodes: {
          'debate-node-1': node
        }
      }
    });
  });
  
  it('renders debate node with correct topic', () => {
    render(
      <Provider store={store}>
        <ChakraProvider>
          <DebateNode 
            node={node}
            isSelected={false}
            isActive={false}
            onSelect={() => {}}
          />
        </ChakraProvider>
      </Provider>
    );
    
    // 验证节点题目正确渲染
    expect(screen.getByText('人工智能对教育的影响')).toBeInTheDocument();
  });
  
  it('shows correct number of perspectives', () => {
    render(
      <Provider store={store}>
        <ChakraProvider>
          <DebateNode 
            node={node}
            isSelected={false}
            isActive={false}
            onSelect={() => {}}
          />
        </ChakraProvider>
      </Provider>
    );
    
    // 验证显示正确的观点数量
    expect(screen.getByText('3个观点')).toBeInTheDocument();
  });
  
  it('handles node selection properly', () => {
    const mockSelect = jest.fn();
    
    render(
      <Provider store={store}>
        <ChakraProvider>
          <DebateNode 
            node={node}
            isSelected={false}
            isActive={false}
            onSelect={mockSelect}
          />
        </ChakraProvider>
      </Provider>
    );
    
    // 模拟点击节点
    fireEvent.mouseDown(screen.getByText('辩论节点').closest('div')!);
    
    // 验证选择回调被调用
    expect(mockSelect).toHaveBeenCalledWith('debate-node-1', expect.any(Boolean));
  });
}); 