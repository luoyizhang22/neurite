import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { IEdge, INode } from '@types/graph';

interface EdgeProps {
  edge: IEdge;
  sourceNode: INode;
  targetNode: INode;
  viewportScale: number;
  viewportOffset: { x: number; y: number };
  isSelected: boolean;
  onSelect: (edgeId: string) => void;
}

const Edge: React.FC<EdgeProps> = ({ 
  edge, 
  sourceNode, 
  targetNode,
  viewportScale,
  viewportOffset,
  isSelected,
  onSelect
}) => {
  // 边的类型决定颜色和样式
  const getEdgeStyle = () => {
    switch (edge.type) {
      case 'direct':
        return { 
          color: useColorModeValue('gray.500', 'gray.400'), 
          width: '1px', 
          dashArray: 'none' 
        };
      case 'reference':
        return { 
          color: useColorModeValue('blue.500', 'blue.400'), 
          width: '1px', 
          dashArray: '4,4' 
        };
      case 'question':
        return { 
          color: useColorModeValue('purple.500', 'purple.400'), 
          width: '1.5px', 
          dashArray: 'none' 
        };
      case 'answer':
        return { 
          color: useColorModeValue('green.500', 'green.400'), 
          width: '1.5px', 
          dashArray: '4,2' 
        };
      default:
        return { 
          color: useColorModeValue('gray.500', 'gray.400'), 
          width: '1px', 
          dashArray: 'none' 
        };
    }
  };

  // 计算节点中心点坐标
  const getNodeCenter = (node: INode) => {
    // 这里假设节点DOM元素大小。实际应用中，可能需要获取实际节点尺寸
    const nodeWidth = 300; // 估计值，应根据实际节点大小调整
    const nodeHeight = 150; // 估计值，应根据实际节点大小调整
    
    return {
      x: (node.position?.x || 0) + nodeWidth / 2,
      y: (node.position?.y || 0) + nodeHeight / 2
    };
  };

  // 应用视口转换
  const applyViewportTransform = (point: { x: number; y: number }) => {
    return {
      x: point.x * viewportScale + viewportOffset.x,
      y: point.y * viewportScale + viewportOffset.y
    };
  };

  // 获取源节点和目标节点的中心点
  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  
  // 应用视口转换
  const transformedSource = applyViewportTransform(sourceCenter);
  const transformedTarget = applyViewportTransform(targetCenter);

  // 计算线的路径（使用贝塞尔曲线）
  const path = () => {
    const dx = transformedTarget.x - transformedSource.x;
    const dy = transformedTarget.y - transformedSource.y;
    
    // 控制点偏移，用于生成曲线
    const offset = Math.sqrt(dx * dx + dy * dy) * 0.2;
    
    // 控制点坐标
    const controlPoint1 = {
      x: transformedSource.x + dx * 0.3 + (dy > 0 ? offset : -offset),
      y: transformedSource.y + dy * 0.1
    };
    
    const controlPoint2 = {
      x: transformedSource.x + dx * 0.7,
      y: transformedTarget.y - dy * 0.1 + (dx > 0 ? -offset : offset)
    };
    
    return `M ${transformedSource.x} ${transformedSource.y} 
            C ${controlPoint1.x} ${controlPoint1.y}, 
              ${controlPoint2.x} ${controlPoint2.y}, 
              ${transformedTarget.x} ${transformedTarget.y}`;
  };

  // 绘制箭头标记
  const markerEnd = `url(#${edge.type}Marker)`;
  
  // 获取边的样式
  const { color, width, dashArray } = getEdgeStyle();
  
  // 选中状态的宽度增加
  const strokeWidth = isSelected ? `calc(${width} + 1px)` : width;
  
  // 处理边的点击事件
  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(edge.id);
  };

  return (
    <>
      {/* 为每种类型的边定义箭头标记 */}
      <svg width="0" height="0">
        <defs>
          <marker
            id={`${edge.type}Marker`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        </defs>
      </svg>
      
      <Box 
        as="path"
        d={path()}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={dashArray}
        markerEnd={markerEnd}
        cursor="pointer"
        _hover={{ strokeWidth: `calc(${width} + 2px)` }}
        onClick={handleEdgeClick}
        transition="stroke-width 0.2s"
        zIndex={isSelected ? 5 : 1}
      />
    </>
  );
};

export default Edge; 