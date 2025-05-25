import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { getNodeComponent } from '@components/nodes';
import { useAppDispatch, useAppSelector } from '@hooks/reduxHooks';
import { 
  selectNodes, 
  updateNodePosition 
} from '@store/slices/nodesSlice';
import { 
  selectActiveNodeId, 
  selectSelectedNodeIds, 
  setActiveNode, 
  selectNodeIds,
  updateViewport,
  selectEdges,
  selectActiveEdgeId,
  setActiveEdge
} from '@store/slices/graphsSlice';
import { INode, IPosition, IViewport, IEdge } from '@types/graph';
import Edge from './Edge';

interface GraphCanvasProps {
  graphId: string;
}

const GraphCanvas = ({ graphId }: GraphCanvasProps) => {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);
  const activeNodeId = useAppSelector(selectActiveNodeId);
  const selectedNodeIds = useAppSelector(selectSelectedNodeIds);
  const activeEdgeId = useAppSelector(selectActiveEdgeId);
  
  // 画布状态
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<IPosition>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [viewport, setViewport] = useState<IViewport>({ x: 0, y: 0, zoom: 1 });
  
  // 连接状态
  const [isConnecting, setIsConnecting] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<IPosition>({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<IPosition>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // 背景颜色
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const gridColor = useColorModeValue('gray.200', 'gray.700');

  // 处理选择节点
  const handleSelectNode = useCallback((nodeId: string, multiSelect: boolean = false) => {
    // 如果正在创建连接
    if (isConnecting && sourceNodeId) {
      // 创建从源节点到目标节点的连接
      handleCreateConnection(sourceNodeId, nodeId);
      // 重置连接状态
      setIsConnecting(false);
      setSourceNodeId(null);
      return;
    }
    
    // 设置活动节点
    dispatch(setActiveNode(nodeId));
    
    // 多选逻辑（按住Ctrl/Cmd键）
    if (multiSelect) {
      // TODO: 实现多选逻辑
      // dispatch(toggleSelectNode(nodeId));
    } else {
      // 单选
      // dispatch(setSelectedNodes([nodeId]));
    }
  }, [dispatch, isConnecting, sourceNodeId]);

  // 处理画布点击（取消所有选择）
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // 如果是鼠标右键，不处理
    if (e.button === 2) return;
    
    // 如果正在创建连接，取消连接
    if (isConnecting) {
      setIsConnecting(false);
      setSourceNodeId(null);
      return;
    }
    
    // 取消选择所有节点和边
    dispatch(setActiveNode(null));
    dispatch(setActiveEdge(null));
    // dispatch(setSelectedNodes([]));
  }, [dispatch, isConnecting]);

  // 开始拖拽节点
  const handleStartDrag = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    // 设置被拖拽节点
    setDraggedNodeId(nodeId);
    setIsDragging(true);
    
    // 计算鼠标位置相对于节点左上角的偏移
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.position) {
      const offsetX = e.clientX - node.position.x;
      const offsetY = e.clientY - node.position.y;
      setDragOffset({ x: offsetX, y: offsetY });
    }
    
    // 设置最后鼠标位置
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [nodes]);

  // 开始画布平移
  const handleStartPan = useCallback((e: React.MouseEvent) => {
    // 只有中键（滚轮按下）或右键开始平移
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // 更新鼠标位置（用于绘制连接线）
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    
    // 处理节点拖拽
    if (isDragging && draggedNodeId) {
      const node = nodes.find(n => n.id === draggedNodeId);
      if (node) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // 更新节点位置（仅在UI中，不立即更新状态以提高性能）
        const nodeElement = document.getElementById(`node-${draggedNodeId}`);
        if (nodeElement) {
          nodeElement.style.left = `${newX}px`;
          nodeElement.style.top = `${newY}px`;
        }
      }
    }
    
    // 处理画布平移
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      setViewport(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }
    
    // 更新最后鼠标位置
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, draggedNodeId, nodes, dragOffset, isPanning]);

  // 处理鼠标抬起
  const handleMouseUp = useCallback(() => {
    // 如果正在拖拽节点，保存最终位置
    if (isDragging && draggedNodeId) {
      const nodeElement = document.getElementById(`node-${draggedNodeId}`);
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect();
        dispatch(updateNodePosition({
          nodeId: draggedNodeId,
          position: {
            x: rect.left,
            y: rect.top
          }
        }));
      }
    }
    
    // 如果正在平移画布，保存视口状态
    if (isPanning) {
      dispatch(updateViewport(viewport));
    }
    
    // 重置状态
    setIsDragging(false);
    setDraggedNodeId(null);
    setIsPanning(false);
  }, [isDragging, draggedNodeId, dispatch, isPanning, viewport]);

  // 处理滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    // 计算新的缩放值
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.max(0.1, Math.min(2, viewport.zoom + delta));
    
    // 更新视口状态
    setViewport(prev => ({
      ...prev,
      zoom: newZoom
    }));
    
    // 保存视口状态
    dispatch(updateViewport({
      ...viewport,
      zoom: newZoom
    }));
  }, [viewport, dispatch]);

  // 开始创建连接
  const handleStartConnection = (nodeId: string) => {
    setIsConnecting(true);
    setSourceNodeId(nodeId);
  };

  // 创建连接
  const handleCreateConnection = (sourceId: string, targetId: string) => {
    // 这里应该分发创建边的操作
    console.log(`创建从 ${sourceId} 到 ${targetId} 的连接`);
    
    // 示例代码，实际应该调用 Redux action
    // dispatch(createEdge({
    //   source: sourceId,
    //   target: targetId,
    //   type: 'direct'
    // }));
  };

  // 选择边
  const handleSelectEdge = (edgeId: string) => {
    dispatch(setActiveEdge(edgeId));
  };

  // 设置事件监听
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // 添加事件监听
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      
      // 移除事件监听
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleMouseMove, handleMouseUp, handleWheel]);

  // 计算动态连接线路径
  const getTemporaryConnectionPath = useCallback(() => {
    if (!isConnecting || !sourceNodeId) return '';
    
    const sourceNode = nodes.find(node => node.id === sourceNodeId);
    if (!sourceNode || !sourceNode.position) return '';
    
    // 计算源节点中心点
    const sourceX = sourceNode.position.x + 150; // 假设节点宽度为300
    const sourceY = sourceNode.position.y + 75;  // 假设节点高度为150
    
    // 应用视口变换
    const transformedSourceX = sourceX * viewport.zoom + viewport.x;
    const transformedSourceY = sourceY * viewport.zoom + viewport.y;
    
    // 贝塞尔曲线控制点
    const controlPoint1X = transformedSourceX + (mousePosition.x - transformedSourceX) * 0.4;
    const controlPoint1Y = transformedSourceY;
    const controlPoint2X = mousePosition.x - (mousePosition.x - transformedSourceX) * 0.4;
    const controlPoint2Y = mousePosition.y;
    
    return `M ${transformedSourceX} ${transformedSourceY} 
            C ${controlPoint1X} ${controlPoint1Y}, 
              ${controlPoint2X} ${controlPoint2Y}, 
              ${mousePosition.x} ${mousePosition.y}`;
  }, [isConnecting, sourceNodeId, nodes, mousePosition, viewport]);

  // 渲染节点
  const renderNodes = () => {
    return nodes.map(node => {
      const NodeComponent = getNodeComponent(node.type);
      const isActive = node.id === activeNodeId;
      const isSelected = selectedNodeIds.includes(node.id);
      
      return (
        <div 
          key={node.id}
          id={`node-${node.id}`}
          style={{
            position: 'absolute',
            left: `${(node.position?.x || 0) + viewport.x}px`,
            top: `${(node.position?.y || 0) + viewport.y}px`,
            transform: `scale(${viewport.zoom})`,
            transformOrigin: 'top left',
          }}
        >
          <NodeComponent
            node={node}
            isActive={isActive}
            isSelected={isSelected}
            onSelect={handleSelectNode}
            onStartDrag={handleStartDrag}
            onStartConnection={handleStartConnection}
          />
        </div>
      );
    });
  };

  // 渲染边
  const renderEdges = () => {
    if (!edges || edges.length === 0) return null;
    
    return edges.map(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;
      
      return (
        <Edge
          key={edge.id}
          edge={edge}
          sourceNode={sourceNode}
          targetNode={targetNode}
          viewportScale={viewport.zoom}
          viewportOffset={viewport}
          isSelected={edge.id === activeEdgeId}
          onSelect={handleSelectEdge}
        />
      );
    });
  };

  return (
    <Box
      ref={canvasRef}
      flex="1"
      position="relative"
      bg={bgColor}
      overflow="hidden"
      cursor={isPanning ? 'grabbing' : isConnecting ? 'crosshair' : 'default'}
      backgroundImage={`linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`}
      backgroundSize={`${20 * viewport.zoom}px ${20 * viewport.zoom}px`}
      backgroundPosition={`${viewport.x}px ${viewport.y}px`}
      onClick={handleCanvasClick}
      onMouseDown={handleStartPan}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* SVG层用于绘制边 */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        {renderEdges()}
        
        {/* 临时连接线 */}
        {isConnecting && (
          <path
            d={getTemporaryConnectionPath()}
            stroke="blue"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,5"
            pointerEvents="none"
          />
        )}
      </svg>
      
      {renderNodes()}
    </Box>
  );
};

export default GraphCanvas; 