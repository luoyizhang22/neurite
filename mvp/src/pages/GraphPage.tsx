import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Flex,
  Heading,
  Text,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tooltip,
  useToast,
  Badge,
  VStack,
  HStack,
  Divider,
  Image,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  useColorModeValue
} from '@chakra-ui/react';
import { FiPlus, FiSave, FiTrash2, FiZoomIn, FiZoomOut, FiCpu, FiImage, FiLink, FiZap, 
  FiRotateCcw, FiRotateCw, FiSettings, FiFileText, FiHelpCircle, FiMessageCircle, 
  FiUsers, FiArrowRightCircle, FiMaximize, FiBookOpen, FiMessageSquare, FiMoreVertical,
  FiList, FiShare2, FiGitBranch, FiActivity, FiEye, FiLayers, FiEdit2, FiTrash, FiExternalLink } from 'react-icons/fi';
import nodeTypes from '@components/nodes';
import edgeTypes from '@components/edges';
import { INode } from '@types/graph';
import { useDispatch, useSelector } from 'react-redux';
import { addNode } from '@store/slices/nodesSlice';
import { RootState } from '@store/index';
import { v4 as uuidv4 } from 'uuid';

// Mock data - will be fetched from Redux in real application
import { useParams, useNavigate } from 'react-router-dom';
import DebateAssistant from '@components/ai/DebateAssistant';
import KnowledgeTree from '../components/knowledge/KnowledgeTree';
import AIModelSettings from '@components/settings/AIModelSettings';
import MultiNodeQuery from '@components/ai/MultiNodeQuery';
import { useTranslation } from 'react-i18next';

const mockNodes = [
  { 
    id: 'node1', 
    type: 'text', 
    position: { x: 100, y: 100 }, 
    content: 'Core Concept: Non-linear characteristics of human learning', 
    isSelected: false 
  },
  { 
    id: 'node2', 
    type: 'text', 
    position: { x: 300, y: 50 }, 
    content: 'Limitations of traditional notes: Linear records struggle to express complex relationships', 
    isSelected: false 
  },
  { 
    id: 'node3', 
    type: 'text', 
    position: { x: 300, y: 150 }, 
    content: 'Proposed solution: Structured knowledge nodes with dynamic connections', 
    isSelected: false 
  },
];

const mockConnections = [
  { id: 'conn1', source: 'node1', target: 'node2' },
  { id: 'conn2', source: 'node1', target: 'node3' },
];

const GraphPage = () => {
  const { graphId } = useParams<{ graphId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDebateOpen, 
    onOpen: onOpenDebate, 
    onClose: onCloseDebate 
  } = useDisclosure();
  const { t } = useTranslation();
  
  const [isMultiNodeQueryOpen, setIsMultiNodeQueryOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  
  // States
  const [nodes, setNodes] = useState(mockNodes);
  const [connections, setConnections] = useState(mockConnections);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodeDragging, setNodeDragging] = useState<string | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [graphTitle, setGraphTitle] = useState(`Mind Map ${graphId}`);
  const [isKnowledgeTreeOpen, setIsKnowledgeTreeOpen] = useState(false);
  const [bgColor, setBgColor] = useState('');
  
  // Color mode related values
  const defaultBgColor = useColorModeValue('gray.50', 'gray.800');
  const connectionColor = useColorModeValue('gray.500', 'gray.400');
  const nodeColor = useColorModeValue('white', 'gray.800');
  const nodeBorderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBgColor = useColorModeValue('white', 'gray.800');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const modalBgColor = useColorModeValue('white', 'gray.700');
  const drawerBgColor = useColorModeValue('white', 'gray.800');
  const drawerBorderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBorderColor = 'purple.400';
  
  // Use useEffect to set background color
  useEffect(() => {
    setBgColor(defaultBgColor);
  }, [defaultBgColor]);
  
  // Add selection box state variable
  const [selectionBox, setSelectionBox] = useState({ 
    isActive: false, 
    start: { x: 0, y: 0 }, 
    end: { x: 0, y: 0 } 
  });
  
  // Add history state at the top of the component
  const [history, setHistory] = useState<{nodes: any[], connections: any[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const dispatch = useDispatch();
  
  // Save current state to history
  const saveToHistory = () => {
    // If current is not the last step of history, truncate history
    const newHistory = historyIndex < history.length - 1
      ? history.slice(0, historyIndex + 1)
      : [...history];
      
    // Add current state to history
    newHistory.push({
      nodes: [...nodes],
      connections: [...connections]
    });
    
    // Limit history length to 50 steps
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Undo operation
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      setNodes(previousState.nodes);
      setConnections(previousState.connections);
      setHistoryIndex(newIndex);
      
      toast({
        title: t('mindMap.undoSuccess') || "Undone",
        status: "info",
        duration: 1000,
        isClosable: true,
      });
    } else {
      toast({
        title: t('mindMap.cannotUndo') || "Cannot undo",
        description: t('mindMap.earliestRecord') || "Already at the earliest record",
        status: "warning",
        duration: 1500,
        isClosable: true,
      });
    }
  };
  
  // Redo operation
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setHistoryIndex(newIndex);
      
      toast({
        title: t('mindMap.redoSuccess') || "Redone",
        status: "info",
        duration: 1000,
        isClosable: true,
      });
    } else {
      toast({
        title: t('mindMap.cannotRedo') || "Cannot redo",
        description: t('mindMap.latestRecord') || "Already at the latest record",
        status: "warning",
        duration: 1500,
        isClosable: true,
      });
    }
  };
  
  // Load data (simulation)
  useEffect(() => {
    if (graphId === 'new') {
      setGraphTitle(t('mindMap.newMap') || 'New Mind Map');
      setNodes([]);
      setConnections([]);
    } else {
      // In real application, load data from Redux
      console.log(`Loading graph ID: ${graphId}`);
    }
  }, [graphId, t]);
  
  // Add keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected nodes (Delete key or Backspace key)
      if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement === document.body) {
        const selectedIds = nodes.filter(node => node.isSelected).map(node => node.id);
        if (selectedIds.length > 0) {
          // Delete nodes
          setNodes(nodes.filter(node => !node.isSelected));
          
          // Delete related connections
          setConnections(connections.filter(
            conn => !selectedIds.includes(conn.source) && !selectedIds.includes(conn.target)
          ));
          
          toast({
            title: t('mindMap.deletedNodes', { count: selectedIds.length }) || `Deleted ${selectedIds.length} nodes`,
            status: "success",
            duration: 1500,
            isClosable: true,
          });
        }
      }
      
      // Select all (Ctrl+A)
      if (e.key === 'a' && (e.ctrlKey || e.metaKey) && document.activeElement === document.body) {
        e.preventDefault();
        setNodes(nodes.map(node => ({
          ...node,
          isSelected: true
        })));
      }
      
      // Cancel selection (Escape key)
      if (e.key === 'Escape') {
        setNodes(nodes.map(node => ({
          ...node,
          isSelected: false
        })));
      }
      
      // Copy selected nodes (Ctrl+C)
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && document.activeElement === document.body) {
        const selectedNodes = nodes.filter(node => node.isSelected);
        if (selectedNodes.length > 0) {
          // Store selected nodes in sessionStorage
          sessionStorage.setItem('copiedNodes', JSON.stringify(selectedNodes));
          
          toast({
            title: t('mindMap.copiedNodes', { count: selectedNodes.length }) || `Copied ${selectedNodes.length} nodes`,
            status: "info",
            duration: 1500,
            isClosable: true,
          });
        }
      }
      
      // Paste nodes (Ctrl+V)
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && document.activeElement === document.body) {
        const copiedNodesString = sessionStorage.getItem('copiedNodes');
        if (copiedNodesString) {
          try {
            const copiedNodes = JSON.parse(copiedNodesString);
            
            // Create new IDs for copied nodes and adjust positions
            const newNodes = copiedNodes.map((node: any, index: number) => {
              const newId = `node${nodes.length + index + 1}`;
              return {
                ...node,
                id: newId,
                position: {
                  x: node.position.x + 50,
                  y: node.position.y + 50
                },
                isSelected: true
              };
            });
            
            // Update node state, first deselect existing nodes
            setNodes([
              ...nodes.map(node => ({ ...node, isSelected: false })),
              ...newNodes
            ]);
            
            toast({
              title: `已粘贴 ${newNodes.length} 个节点`,
              status: "success",
              duration: 1500,
              isClosable: true,
            });
          } catch (error) {
            console.error('粘贴节点时出错:', error);
            toast({
              title: "粘贴失败",
              description: "无法解析复制的节点数据",
              status: "error",
              duration: 2000,
              isClosable: true,
            });
          }
        }
      }
      
      // 撤销操作 (Ctrl+Z)
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && document.activeElement === document.body) {
        e.preventDefault();
        undo();
      }
      
      // 重做操作 (Ctrl+Y 或 Ctrl+Shift+Z)
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || 
          (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) && 
          document.activeElement === document.body) {
        e.preventDefault();
        redo();
      }
    };
    
    // 添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown);
    
    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, connections, setNodes, setConnections, toast, history, historyIndex]);
  
  // 修改canvas鼠标按下事件处理函数
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      if (e.shiftKey) {
        // 启动框选模式
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const startX = (e.clientX - rect.left) / zoom - position.x / zoom;
          const startY = (e.clientY - rect.top) / zoom - position.y / zoom;
          setSelectionBox({
            isActive: true,
            start: { x: startX, y: startY },
            end: { x: startX, y: startY }
          });
        }
      } else {
        // 普通画布拖动
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        
        // 如果没有按住Shift，则清除所有节点选择
        setNodes(nodes.map(node => ({
          ...node,
          isSelected: false
        })));
      }
    }
  };
  
  // 修改鼠标移动函数处理框选
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      // 画布拖动逻辑
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition({
        x: position.x + dx,
        y: position.y + dy
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (nodeDragging) {
      // 节点拖动逻辑
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setNodes(nodes.map(node => {
        // 如果是被拖动的节点或其他被选中的节点，则移动它们
        if (node.id === nodeDragging || (node.isSelected && nodeDragging)) {
          return {
            ...node,
            position: {
              x: node.position.x + dx,
              y: node.position.y + dy
            }
          };
        }
        return node;
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (selectionBox.isActive) {
      // 更新框选区域
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = (e.clientX - rect.left) / zoom - position.x / zoom;
        const currentY = (e.clientY - rect.top) / zoom - position.y / zoom;
        
        setSelectionBox({
          ...selectionBox,
          end: { x: currentX, y: currentY }
        });
        
        // 计算选择框的坐标范围
        const x1 = Math.min(selectionBox.start.x, currentX);
        const y1 = Math.min(selectionBox.start.y, currentY);
        const x2 = Math.max(selectionBox.start.x, currentX);
        const y2 = Math.max(selectionBox.start.y, currentY);
        
        // 根据节点是否在选择框内更新节点的选择状态
        setNodes(nodes.map(node => {
          const nodeInBox = 
            node.position.x >= x1 && 
            node.position.x <= x2 && 
            node.position.y >= y1 && 
            node.position.y <= y2;
          
          return {
            ...node,
            isSelected: nodeInBox || node.isSelected
          };
        }));
      }
    }
  };
  
  // 修改鼠标释放函数，处理框选结束
  const handleCanvasMouseUp = () => {
    // 如果有节点被拖动，保存历史
    if (nodeDragging) {
      saveToHistory();
    }
    
    setIsDragging(false);
    setNodeDragging(null);
    
    // 重置选择框
    if (selectionBox.isActive) {
      // 如果有使用选择框选择节点，保存历史
      const anyNodeSelected = nodes.some(node => node.isSelected);
      if (anyNodeSelected) {
        saveToHistory();
      }
      
      setSelectionBox({ 
        isActive: false, 
        start: { x: 0, y: 0 }, 
        end: { x: 0, y: 0 } 
      });
    }
  };
  
  // 节点事件处理
  const handleNodeSelect = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    saveToHistory();
    
    if (event.shiftKey) {
      setNodes(nodes.map(node => ({
        ...node,
        isSelected: node.id === id ? !node.isSelected : node.isSelected
      })));
    } else {
      setNodes(nodes.map(node => ({
        ...node,
        isSelected: node.id === id
      })));
    }
  };
  
  const handleNodeDragStart = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setNodeDragging(id);
    setDragStart({ x: event.clientX, y: event.clientY });
    
    if (!nodes.find(node => node.id === id)?.isSelected && !event.shiftKey) {
      setNodes(nodes.map(node => ({
        ...node,
        isSelected: node.id === id
      })));
    }
  };
  
  const handleNodeDragMove = (event: React.MouseEvent) => {
    if (nodeDragging) {
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      
      setNodes(nodes.map(node => {
        if (node.id === nodeDragging) {
          return {
            ...node,
            position: {
              x: node.position.x + dx,
              y: node.position.y + dy
            }
          };
        }
        return node;
      }));
      
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  };
  
  // 缩放控制
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // 添加不同类型的节点
  const addTextNode = () => {
    saveToHistory();
    const newNode = createTextNode('新文本节点');
    
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    toast({
      title: "已添加文本节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  const addImageNode = () => {
    saveToHistory();
    const newNode = createImageNode('https://via.placeholder.com/150');
    
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    toast({
      title: "已添加图片节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  const addLinkNode = () => {
    saveToHistory();
    const newNode = createLinkNode('https://example.com');
    
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    toast({
      title: "已添加链接节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  const addAINode = () => {
    saveToHistory();
    const newNode = createChatNode('请输入您的问题...');
    
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    toast({
      title: "已添加AI节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 添加辩论节点
  const addDebateNode = () => {
    saveToHistory();
    const newNode = createDebateNode('添加辩论话题');
    
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    toast({
      title: "已添加辩论节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 添加端口节点
  const addPortNode = () => {
    saveToHistory();
    const newNode = createPortNode('处理模块');
    
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    toast({
      title: "已添加处理模块节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 添加formatBionicText函数
  const formatBionicText = (text: string): string => {
    if (!text) return '';
    
    // 按单词分割文本
    return text.split(' ').map(word => {
      // 对于较短的单词，加粗前半部分
      if (word.length <= 3) {
        return `<strong>${word}</strong>`;
      }
      
      // 对于较长的单词，加粗前60%
      const boldLength = Math.ceil(word.length * 0.6);
      const boldPart = word.substring(0, boldLength);
      const normalPart = word.substring(boldLength);
      
      return `<strong>${boldPart}</strong>${normalPart}`;
    }).join(' ');
  };
  
  // 添加创建仿生阅读节点的函数
  const addBionicTextNode = () => {
    saveToHistory();
    const newNode = createBionicTextNode();
    
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    toast({
      title: "已添加仿生阅读节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 处理从辩论助手添加节点
  const handleAddDebateNode = (nodeData: any) => {
    saveToHistory();
    
    let newNode;
    if (nodeData.type === 'debate') {
      newNode = createDebateNode(nodeData.content || '辩论话题');
      // 如果有额外数据，合并到节点数据中
      if (nodeData.data) {
        newNode.data = {
          ...newNode.data,
          ...nodeData.data
        };
      }
    } else {
      // 默认创建辩论节点
      newNode = createDebateNode(nodeData.content || '辩论话题');
    }
    
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    toast({
      title: "已添加辩论节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 处理节点编辑
  const handleNodeEdit = (nodeId: string, newContent: string, additionalData?: any) => {
    try {
      saveToHistory();
      const nodeIndex = nodes.findIndex(node => node.id === nodeId);
      if (nodeIndex === -1) {
        throw new Error(`节点 ${nodeId} 不存在`);
      }
      
      const updatedNodes = [...nodes];
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        content: newContent
      };
      
      setNodes(updatedNodes);
      
      toast({
        title: "节点已更新",
        status: "success",
        duration: 1500,
        isClosable: true,
      });
    } catch (error) {
      console.error("编辑节点时出错:", error);
      toast({
        title: "编辑节点失败",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };
  
  // 修复连接节点功能
  const connectSelectedNodes = () => {
    // 获取选中的节点ID
    const selectedNodes = nodes.filter(node => node.isSelected);
    
    // 检查是否有两个节点被选中
    if (selectedNodes.length !== 2) {
      toast({
        title: "请选择两个节点进行连接",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    const sourceId = selectedNodes[0].id;
    const targetId = selectedNodes[1].id;
    
    // 检查是否已存在相同的连接
    const connectionExists = connections.some(
      conn => (conn.source === sourceId && conn.target === targetId) || 
              (conn.source === targetId && conn.target === sourceId)
    );
    
    if (connectionExists) {
      toast({
        title: "连接已存在",
        description: "这两个节点已经连接",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    // 打开连接类型选择对话框
    const connectionType = prompt(
      "请选择连接类型:\n1. 直接连接\n2. 引用关系\n3. 因果关系\n4. 支持关系\n5. 反对关系\n6. 相似关系\n7. 差异关系\n8. 扩展关系\n9. 包含关系\n\n请输入数字(1-9):",
      "1"
    );
    
    if (!connectionType) return;
    
    // 映射连接类型
    const typeMap: {[key: string]: string} = {
      "1": "direct",
      "2": "reference",
      "3": "cause",
      "4": "support",
      "5": "oppose",
      "6": "similar",
      "7": "different",
      "8": "extends",
      "9": "includes"
    };
    
    const type = typeMap[connectionType] || "direct";
    
    // 获取连接标签
    const label = prompt("请输入连接标签(可选):", "");
    
    // 创建新连接前保存历史
    saveToHistory();
    
    // 创建新连接
    const newConnection = {
      id: `conn${connections.length + 1}`,
      source: sourceId,
      target: targetId,
      type,
      label: label || undefined,
      style: getDefaultStyleForType(type)
    };
    
    setConnections([...connections, newConnection]);
    
    toast({
      title: "已创建连接",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 添加获取连接线默认样式的函数
  const getDefaultStyleForType = (type: string) => {
    switch(type) {
      case 'direct':
        return { strokeWidth: 2, strokeColor: 'gray.500', strokeDashArray: '0' };
      case 'reference':
        return { strokeWidth: 2, strokeColor: 'blue.400', strokeDashArray: '5,5' };
      case 'cause':
        return { strokeWidth: 3, strokeColor: 'red.400', strokeDashArray: '0', animated: true };
      case 'effect':
        return { strokeWidth: 3, strokeColor: 'orange.400', strokeDashArray: '0', animated: true };
      case 'support':
        return { strokeWidth: 2, strokeColor: 'green.400', strokeDashArray: '0' };
      case 'oppose':
        return { strokeWidth: 2, strokeColor: 'red.400', strokeDashArray: '0' };
      case 'similar':
        return { strokeWidth: 2, strokeColor: 'purple.300', strokeDashArray: '5,5' };
      case 'different':
        return { strokeWidth: 2, strokeColor: 'yellow.500', strokeDashArray: '5,5' };
      case 'extends':
        return { strokeWidth: 2, strokeColor: 'teal.400', strokeDashArray: '10,5' };
      case 'includes':
        return { strokeWidth: 2, strokeColor: 'cyan.400', strokeDashArray: '10,5' };
      default:
        return { strokeWidth: 2, strokeColor: 'gray.500', strokeDashArray: '0' };
    }
  };
  
  // 添加删除连接功能
  const deleteConnection = (connectionId: string) => {
    saveToHistory();
    setConnections(connections.filter(conn => conn.id !== connectionId));
    
    toast({
      title: "已删除连接",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 添加连接线点击处理
  const handleConnectionClick = (connectionId: string) => {
    // 使用confirm确认是否删除连接
    if (window.confirm("是否要删除此连接？")) {
      deleteConnection(connectionId);
    }
  };
  
  // 添加端口连接逻辑
  const connectPorts = (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => {
    // 检查源节点和目标节点是否存在
    const sourceNode = nodes.find(node => node.id === sourceNodeId);
    const targetNode = nodes.find(node => node.id === targetNodeId);
    
    if (!sourceNode || !targetNode) {
      toast({
        title: "无法连接端口",
        description: "源节点或目标节点不存在",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return false;
    }
    
    // 确保节点是端口类型
    if (sourceNode.type !== 'port' || targetNode.type !== 'port') {
      toast({
        title: "无法连接端口",
        description: "只能连接处理模块节点的端口",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return false;
    }
    
    // 检查端口是否已连接
    const connectionExists = connections.some(
      conn => (conn.source === `${sourceNodeId}:${sourcePortId}` && conn.target === `${targetNodeId}:${targetPortId}`) ||
             (conn.source === `${targetNodeId}:${targetPortId}` && conn.target === `${sourceNodeId}:${sourcePortId}`)
    );
    
    if (connectionExists) {
      toast({
        title: "端口已连接",
        description: "这两个端口已经存在连接",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return false;
    }
    
    // 创建新连接
    const newConnection = {
      id: `conn${connections.length + 1}`,
      source: `${sourceNodeId}:${sourcePortId}`,
      target: `${targetNodeId}:${targetPortId}`,
      type: 'port-connection'
    };
    
    setConnections([...connections, newConnection]);
    
    // 更新节点端口的连接信息
    setNodes(nodes.map(node => {
      if (node.id === sourceNodeId) {
        // 更新源节点的输出端口
        const updatedOutputs = node.data.outputs.map((port: any) => {
          if (port.id === sourcePortId) {
            return {
              ...port,
              connections: [...(port.connections || []), { 
                nodeId: targetNodeId, 
                portId: targetPortId 
              }]
            };
          }
          return port;
        });
        
        return {
          ...node,
          data: {
            ...node.data,
            outputs: updatedOutputs
          }
        };
      } 
      else if (node.id === targetNodeId) {
        // 更新目标节点的输入端口
        const updatedInputs = node.data.inputs.map((port: any) => {
          if (port.id === targetPortId) {
            return {
              ...port,
              connections: [...(port.connections || []), { 
                nodeId: sourceNodeId, 
                portId: sourcePortId 
              }]
            };
          }
          return port;
        });
        
        return {
          ...node,
          data: {
            ...node.data,
            inputs: updatedInputs
          }
        };
      }
      return node;
    }));
    
    toast({
      title: "已连接端口",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
    
    return true;
  };
  
  // 更新端口节点的渲染函数
  const renderPortNode = (node: any) => {
    return (
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Badge colorScheme="orange">处理模块</Badge>
          {node.isSelected && (
            <IconButton
              aria-label="编辑节点"
              icon={<FiEdit2 size="14px" />}
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                const newTitle = prompt("编辑模块标题", node.data?.title || "");
                if (newTitle !== null) {
                  handleNodeEdit(node.id, node.content, { title: newTitle });
                }
              }}
            />
          )}
        </Flex>
        <Text fontWeight="bold">{node.data?.title || "处理模块"}</Text>
        <Text fontSize="sm" mb={2}>{node.data?.description || ""}</Text>
        
        {/* 输入端口 */}
        <Box mt={3} mb={2}>
          <Text fontSize="xs" fontWeight="bold" mb={1}>输入:</Text>
          {node.data?.inputs?.map((input: any, index: number) => (
            <Flex key={input.id} align="center" mb={1}>
              <Box 
                w="10px" 
                h="10px" 
                borderRadius="full" 
                bg="blue.400" 
                mr={2}
                data-port-id={input.id}
                data-port-type="input"
                data-node-id={node.id}
                cursor="pointer"
                _hover={{ boxShadow: "0 0 0 2px blue.300" }}
                onClick={(e) => {
                  e.stopPropagation();
                  // 处理端口点击 - 此处可添加连接逻辑
                  console.log(`输入端口点击: ${node.id}:${input.id}`);
                }}
              />
              <Text fontSize="xs">{input.name}</Text>
            </Flex>
          ))}
        </Box>
        
        {/* 输出端口 */}
        <Box mb={2}>
          <Text fontSize="xs" fontWeight="bold" mb={1}>输出:</Text>
          {node.data?.outputs?.map((output: any, index: number) => (
            <Flex key={output.id} align="center" mb={1} justify="flex-end">
              <Text fontSize="xs">{output.name}</Text>
              <Box 
                w="10px" 
                h="10px" 
                borderRadius="full" 
                bg="green.400" 
                ml={2}
                data-port-id={output.id}
                data-port-type="output"
                data-node-id={node.id}
                cursor="pointer"
                _hover={{ boxShadow: "0 0 0 2px green.300" }}
                onClick={(e) => {
                  e.stopPropagation();
                  // 处理端口点击 - 此处可添加连接逻辑
                  console.log(`输出端口点击: ${node.id}:${output.id}`);
                }}
              />
            </Flex>
          ))}
        </Box>
      </Box>
    );
  };
  
  // 渲染节点内容
  const renderNodeContent = (node: any) => {
    switch (node.type) {
      case 'text':
        return (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Badge colorScheme="blue">文本</Badge>
              {node.isSelected && (
                <IconButton
                  aria-label="编辑节点"
                  icon={<FiEdit2 size="14px" />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newContent = prompt("编辑节点内容", node.content);
                    if (newContent !== null) {
                      handleNodeEdit(node.id, newContent);
                    }
                  }}
                />
              )}
            </Flex>
            <Text>{node.content}</Text>
          </Box>
        );
        
      case 'image':
        return (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Badge colorScheme="green">图片</Badge>
              {node.isSelected && (
                <IconButton
                  aria-label="编辑节点"
                  icon={<FiEdit2 size="14px" />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newUrl = prompt("编辑图片URL", node.data?.url || "");
                    if (newUrl !== null) {
                      const updatedNode = {
                        ...node,
                        data: { ...node.data, url: newUrl }
                      };
                      const updatedNodes = nodes.map(n => 
                        n.id === node.id ? updatedNode : n
                      );
                      setNodes(updatedNodes);
                    }
                  }}
                />
              )}
            </Flex>
            {node.data?.url ? (
              <Image 
                src={node.data.url} 
                alt={node.content || "图片"} 
                maxH="160px"
                maxW="280px"
                objectFit="contain"
                borderRadius="md"
              />
            ) : (
              <Box 
                bg="gray.100" 
                color="gray.500" 
                h="100px" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                borderRadius="md"
              >
                <FiImage size="24px" />
              </Box>
            )}
            {node.content && <Text mt={2} fontSize="sm">{node.content}</Text>}
          </Box>
        );
        
      case 'link':
        return (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Badge colorScheme="purple">链接</Badge>
              {node.isSelected && (
                <IconButton
                  aria-label="编辑节点"
                  icon={<FiEdit2 size="14px" />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newUrl = prompt("编辑链接URL", node.data?.url || "");
                    if (newUrl !== null) {
                      const updatedNode = {
                        ...node,
                        data: { ...node.data, url: newUrl }
                      };
                      const updatedNodes = nodes.map(n => 
                        n.id === node.id ? updatedNode : n
                      );
                      setNodes(updatedNodes);
                    }
                  }}
                />
              )}
            </Flex>
            <Link href={node.data?.url} isExternal color="blue.500" fontWeight="medium">
              {node.content || node.data?.url || "链接"}
              <Icon as={FiExternalLink} mx="2px" />
            </Link>
          </Box>
        );
        
      case 'ai':
        return (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Badge colorScheme="teal">AI</Badge>
              {node.isSelected && (
                <IconButton
                  aria-label="编辑节点"
                  icon={<FiEdit2 size="14px" />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newContent = prompt("编辑AI节点内容", node.content);
                    if (newContent !== null) {
                      handleNodeEdit(node.id, newContent);
                    }
                  }}
                />
              )}
            </Flex>
            <Text>{node.content}</Text>
          </Box>
        );
        
      case 'debate':
        return (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Badge colorScheme="red">辩论</Badge>
              {node.isSelected && (
                <IconButton
                  aria-label="编辑节点"
                  icon={<FiEdit2 size="14px" />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newContent = prompt("编辑辩论节点内容", node.content);
                    if (newContent !== null) {
                      handleNodeEdit(node.id, newContent);
                    }
                  }}
                />
              )}
            </Flex>
            <Text>{node.content}</Text>
          </Box>
        );
        
      case 'port':
        return renderPortNode(node);
        
      case 'bionicText':
        return (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Badge colorScheme="cyan">仿生阅读</Badge>
              {node.isSelected && (
                <IconButton
                  aria-label="编辑节点"
                  icon={<FiEdit2 size="14px" />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newContent = prompt("编辑仿生阅读内容", node.content);
                    if (newContent !== null) {
                      handleNodeEdit(node.id, newContent);
                    }
                  }}
                />
              )}
            </Flex>
            <Box dangerouslySetInnerHTML={{ __html: formatBionicText(node.content) }} />
          </Box>
        );
        
      default:
        return <Text>{node.content}</Text>;
    }
  };
  
  // 计算连接线的路径
  const calculateConnectionPath = (connection: any) => {
    // 处理端口连接
    if (connection.type === 'port-connection') {
      // 解析源和目标
      const [sourceNodeId, sourcePortId] = connection.source.split(':');
      const [targetNodeId, targetPortId] = connection.target.split(':');
      
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      const targetNode = nodes.find(node => node.id === targetNodeId);
      
      if (!sourceNode || !targetNode) {
        return '';
      }
      
      // 获取源节点和目标节点的位置
      const sourceX = sourceNode.position.x + 250; // 假设节点宽度为250px，输出端口在右侧
      const sourceY = sourceNode.position.y + 100; // 假设节点高度为200px，端口在中间位置
      
      const targetX = targetNode.position.x; // 输入端口在左侧
      const targetY = targetNode.position.y + 100;
      
      // 计算控制点，创建平滑的曲线
      const dx = Math.abs(targetX - sourceX);
      const controlPointOffset = Math.min(100, Math.max(50, dx / 3));
      
      // 创建贝塞尔曲线路径
      return `M ${sourceX} ${sourceY} C ${sourceX + controlPointOffset} ${sourceY}, ${targetX - controlPointOffset} ${targetY}, ${targetX} ${targetY}`;
    }
    
    // 处理普通节点连接
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      return '';
    }
    
    // 获取源节点和目标节点的中心点坐标
    const sourceX = sourceNode.position.x + 125; // 假设节点宽度为250px
    const sourceY = sourceNode.position.y + 75; // 假设节点高度为150px
    const targetX = targetNode.position.x + 125;
    const targetY = targetNode.position.y + 75;
    
    // 寻找合适的连接点 - 这里使用简化的方法计算节点边缘的连接点
    // 计算两点之间的角度
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
    
    // 节点尺寸
    const nodeWidth = 250;
    const nodeHeight = 150;
    const halfWidth = nodeWidth / 2;
    const halfHeight = nodeHeight / 2;
    
    // 源节点连接点
    let sx, sy;
    // 目标节点连接点
    let tx, ty;
    
    // 根据角度确定连接点在节点的哪个边
    // 源节点
    if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
      // 连接线主要是水平方向
      sx = sourceX + (Math.cos(angle) > 0 ? halfWidth : -halfWidth);
      sy = sourceY + Math.tan(angle) * (Math.cos(angle) > 0 ? halfWidth : -halfWidth);
      
      // 如果sy超出节点边界，则连接点在上边缘或下边缘
      if (sy > sourceY + halfHeight) {
        sy = sourceY + halfHeight;
        sx = sourceX + halfHeight / Math.tan(angle);
      } else if (sy < sourceY - halfHeight) {
        sy = sourceY - halfHeight;
        sx = sourceX - halfHeight / Math.tan(angle);
      }
    } else {
      // 连接线主要是垂直方向
      sy = sourceY + (Math.sin(angle) > 0 ? halfHeight : -halfHeight);
      sx = sourceX + (Math.sin(angle) > 0 ? halfHeight : -halfHeight) / Math.tan(angle);
      
      // 如果sx超出节点边界，则连接点在左边缘或右边缘
      if (sx > sourceX + halfWidth) {
        sx = sourceX + halfWidth;
        sy = sourceY + halfWidth * Math.tan(angle);
      } else if (sx < sourceX - halfWidth) {
        sx = sourceX - halfWidth;
        sy = sourceY - halfWidth * Math.tan(angle);
      }
    }
    
    // 目标节点 - 使用相反的角度
    if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
      tx = targetX + (Math.cos(angle) < 0 ? halfWidth : -halfWidth);
      ty = targetY + Math.tan(angle + Math.PI) * (Math.cos(angle) < 0 ? halfWidth : -halfWidth);
      
      if (ty > targetY + halfHeight) {
        ty = targetY + halfHeight;
        tx = targetX + halfHeight / Math.tan(angle + Math.PI);
      } else if (ty < targetY - halfHeight) {
        ty = targetY - halfHeight;
        tx = targetX - halfHeight / Math.tan(angle + Math.PI);
      }
    } else {
      ty = targetY + (Math.sin(angle) < 0 ? halfHeight : -halfHeight);
      tx = targetX + (Math.sin(angle) < 0 ? halfHeight : -halfHeight) / Math.tan(angle + Math.PI);
      
      if (tx > targetX + halfWidth) {
        tx = targetX + halfWidth;
        ty = targetY + halfWidth * Math.tan(angle + Math.PI);
      } else if (tx < targetX - halfWidth) {
        tx = targetX - halfWidth;
        ty = targetY - halfWidth * Math.tan(angle + Math.PI);
      }
    }
    
    // 计算贝塞尔曲线控制点
    const dx = Math.abs(tx - sx);
    const dy = Math.abs(ty - sy);
    const controlPointOffset = Math.min(100, Math.max(50, dx / 4 + dy / 4));
    
    // 计算控制点，创建平滑的曲线
    const cpx1 = sx + (tx - sx) / 3;
    const cpy1 = sy + (ty - sy) / 3;
    const cpx2 = sx + (tx - sx) * 2 / 3;
    const cpy2 = sy + (ty - sy) * 2 / 3;
    
    // 创建三次贝塞尔曲线路径
    return `M ${sx} ${sy} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${tx} ${ty}`;
  };
  
  // 获取连接线样式
  const getConnectionStyle = (connection: any) => {
    // 基础样式
    const baseStyle = {
      stroke: connectionColor,
      strokeWidth: 2,
      fill: 'none',
      cursor: 'pointer'
    };
    
    // 如果连接有自定义样式，优先使用
    if (connection.style) {
      return {
        ...baseStyle,
        stroke: connection.style.strokeColor || baseStyle.stroke,
        strokeWidth: connection.style.strokeWidth || baseStyle.strokeWidth,
        strokeDasharray: connection.style.strokeDashArray || '0',
        animation: connection.style.animated ? 'flowAnimation 30s linear infinite' : 'none'
      };
    }
    
    // 根据连接类型返回不同样式
    switch (connection.type) {
      case 'port-connection':
        return {
          ...baseStyle,
          stroke: 'green.400',
          strokeWidth: 3,
          strokeDasharray: '0'
        };
      case 'debate-connection':
        return {
          ...baseStyle,
          stroke: 'purple.400',
          strokeDasharray: '5,5'
        };
      case 'ai-connection':
        return {
          ...baseStyle,
          stroke: 'blue.400',
          strokeDasharray: '0'
        };
      case 'cause':
        return {
          ...baseStyle,
          stroke: 'red.400',
          strokeWidth: 3,
          strokeDasharray: '0',
          animation: 'flowAnimation 30s linear infinite'
        };
      case 'effect':
        return {
          ...baseStyle,
          stroke: 'orange.400',
          strokeWidth: 3,
          strokeDasharray: '0',
          animation: 'flowAnimation 30s linear infinite'
        };
      case 'support':
        return {
          ...baseStyle,
          stroke: 'green.400',
          strokeDasharray: '0'
        };
      case 'oppose':
        return {
          ...baseStyle,
          stroke: 'red.400',
          strokeDasharray: '0'
        };
      case 'reference':
        return {
          ...baseStyle,
          stroke: 'blue.400',
          strokeDasharray: '5,5'
        };
      case 'similar':
        return {
          ...baseStyle,
          stroke: 'purple.300',
          strokeDasharray: '5,5'
        };
      case 'different':
        return {
          ...baseStyle,
          stroke: 'yellow.500',
          strokeDasharray: '5,5'
        };
      case 'extends':
        return {
          ...baseStyle,
          stroke: 'teal.400',
          strokeDasharray: '10,5'
        };
      case 'includes':
        return {
          ...baseStyle,
          stroke: 'cyan.400',
          strokeDasharray: '10,5'
        };
      default:
        return baseStyle;
    }
  };
  
  // 修改错误处理
  const handleError = (error: any, operation: string) => {
    console.error(`操作"${operation}"出错:`, error);
    
    toast({
      title: "操作失败",
      description: `${operation}时发生错误: ${error.message || '未知错误'}`,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };
  
  // 添加AI助手使用功能
  const handleAIAssistant = async () => {
    const selectedNodes = nodes.filter(node => node.isSelected);
    
    if (selectedNodes.length === 0) {
      toast({
        title: "请先选择节点",
        description: "选择一个或多个节点以使用AI助手",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    toast({
      title: "AI助手正在生成内容",
      description: "正在分析所选节点...",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    
    try {
      // 从各种类型的节点中提取内容
      const nodesContent = selectedNodes.map(node => {
        // 提取不同类型节点的内容
        let content = '';
        let nodeType = '';
        
        if (node.type === 'text' || node.type === 'bionicText') {
          content = node.data?.content || node.content || '';
          nodeType = '文本';
        } else if (node.type === 'image') {
          // 图片节点需要提取URL和说明文字
          const url = node.data?.url || '';
          const caption = node.data?.caption || '';
          const alt = node.data?.alt || '';
          content = `图片URL: ${url}\n图片说明: ${caption || alt || '无说明'}`;
          nodeType = '图片';
        } else if (node.type === 'ai') {
          // AI节点需要提取提示词和回复
          content = `提示词: ${node.data?.prompt || ''}\n回复: ${node.data?.response || ''}`;
          nodeType = 'AI对话';
        } else if (node.type === 'debate') {
          // 辩论节点
          content = node.data?.topic || node.content || '';
          nodeType = '辩论主题';
        } else if (node.type === 'link') {
          // 链接节点
          content = `标题: ${node.data?.title || ''}\n链接: ${node.data?.url || ''}\n描述: ${node.data?.description || ''}`;
          nodeType = '链接';
        } else if (node.type === 'port') {
          // 端口节点
          content = node.data?.content || node.content || '';
          nodeType = '端口';
        } else {
          content = node.content || JSON.stringify(node.data) || '';
          nodeType = node.type || '未知';
        }
        
        return { id: node.id, type: nodeType, content };
      });
      
      // 构建提示词
      const prompt = `请基于以下${selectedNodes.length}个节点的内容生成深度分析和见解：\n\n${
        nodesContent.map((node, index) => 
          `节点 ${index + 1} (类型: ${node.type}):\n${node.content}`
        ).join('\n\n')
      }\n\n请提供对这些内容的综合分析，包括关键概念、潜在联系和重要见解。格式请使用Markdown，包含标题、小标题和要点列表。`;
      
      // 使用默认模型配置
      const defaultModel = 'qwen2.5:7b';  // 使用Ollama上的默认模型，可以根据需要调整
      
      // 发送请求到AI服务
      const response = await aiService.sendRequest({
        model: defaultModel,
        messages: [
          { role: 'system', content: '你是Neurite-Storm的AI助手，擅长分析和整合不同类型节点的内容，提供有深度的见解。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        provider: 'ollama' // 默认使用Ollama，可以根据配置调整
      });
      
      if (!response || !response.text) {
        throw new Error('AI服务返回空响应');
      }
      
      // 创建一个新的AI结果节点
      const nodeId = uuidv4();
      const newNode = {
        id: nodeId,
        type: 'ai',
        position: {
          x: -position.x + window.innerWidth / 2 / zoom - 150, 
          y: -position.y + window.innerHeight / 2 / zoom - 100
        },
        data: {
          prompt,
          response: response.text,
          model: defaultModel,
          temperature: 0.7,
          contextNodes: selectedNodes.map(node => node.id),
          updatedAt: new Date().toISOString()
        },
        isSelected: true
      };
      
      // 更新节点状态，取消选择其他节点
      setNodes([
        ...nodes.map(node => ({ ...node, isSelected: false })),
        newNode
      ]);
      
      // 创建从源节点到新节点的连接
      selectedNodes.forEach(sourceNode => {
        const connectionId = uuidv4();
        setConnections([
          ...connections,
          {
            id: connectionId,
            source: sourceNode.id,
            target: nodeId,
            label: 'AI分析'
          }
        ]);
      });
      
      toast({
        title: "AI内容已生成",
        status: "success",
        duration: 1500,
        isClosable: true,
      });
    } catch (error) {
      console.error('AI内容生成失败:', error);
      toast({
        title: "AI内容生成失败",
        description: error instanceof Error ? error.message : "未知错误",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 计算节点和连接的样式
  const getNodeStyle = (node: any) => {
    const baseStyle = {
      position: 'absolute',
      left: `${node.position.x}px`,
      top: `${node.position.y}px`,
      transform: `scale(${zoom})`,
      transformOrigin: 'center',
      transition: isDragging || nodeDragging ? 'none' : 'all 0.2s ease',
      zIndex: node.isSelected ? 2 : 1,
      cursor: nodeDragging ? 'grabbing' : 'pointer'
    };
    
    const typeSpecificStyle = {
      text: {
        width: '200px',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: nodeColor,
        border: `2px solid ${node.isSelected ? selectedBorderColor : nodeBorderColor}`,
        boxShadow: node.isSelected ? 'lg' : 'md',
        transform: node.isSelected ? 'scale(1.02)' : 'scale(1)'
      },
      image: {
        width: '160px',
        padding: '8px',
        borderRadius: '8px',
        backgroundColor: nodeColor,
        border: `2px solid ${node.isSelected ? selectedBorderColor : nodeBorderColor}`,
        boxShadow: node.isSelected ? 'lg' : 'md',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: node.isSelected ? 'scale(1.02)' : 'scale(1)'
      },
      link: {
        width: '200px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: nodeColor,
        border: `2px solid ${node.isSelected ? selectedBorderColor : nodeBorderColor}`,
        boxShadow: node.isSelected ? 'lg' : 'md',
        cursor: 'pointer',
        transform: node.isSelected ? 'scale(1.02)' : 'scale(1)'
      },
      ai: {
        width: '280px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: nodeColor,
        border: `2px solid ${node.isSelected ? selectedBorderColor : 'blue.200'}`,
        borderTopColor: 'blue.400',
        boxShadow: node.isSelected ? 'lg' : 'md',
        cursor: 'pointer',
        transform: node.isSelected ? 'scale(1.02)' : 'scale(1)'
      },
      debate: {
        width: '320px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: nodeColor,
        border: `2px solid ${node.isSelected ? selectedBorderColor : 'purple.200'}`,
        borderTopColor: 'purple.400',
        boxShadow: node.isSelected ? 'lg' : 'md',
        cursor: 'pointer',
        transform: node.isSelected ? 'scale(1.02)' : 'scale(1)'
      },
      port: {
        width: '250px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: nodeColor,
        border: `2px solid ${node.isSelected ? selectedBorderColor : 'orange.200'}`,
        borderTopColor: 'orange.400',
        boxShadow: node.isSelected ? 'lg' : 'md',
        cursor: 'pointer',
        transform: node.isSelected ? 'scale(1.02)' : 'scale(1)'
      },
      bionicText: {
        width: '320px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: nodeColor,
        border: `2px solid ${node.isSelected ? selectedBorderColor : 'cyan.200'}`,
        borderTopColor: 'cyan.400',
        boxShadow: node.isSelected ? 'lg' : 'md',
        cursor: 'pointer',
        transform: node.isSelected ? 'scale(1.02)' : 'scale(1)'
      }
    };
    
    return { ...baseStyle, ...typeSpecificStyle[node.type] };
  };
  
  // 添加创建树节点的函数
  const handleCreateNodeFromBranch = (branchId: string, nodeType: string) => {
    const position = {
      x: Math.random() * 800,
      y: Math.random() * 600
    };
    
    let newNode;
    
    switch (nodeType) {
      case 'text':
        newNode = createTextNode(`来自知识树-${branchId}`, position);
        break;
      case 'ai':
        newNode = createChatNode(`来自知识树-${branchId}`, position);
        break;
      case 'debate':
        newNode = addDebateNode(`来自知识树-${branchId}`, position);
        break;
      case 'port':
        newNode = createPortNode(`来自知识树-${branchId}`, position);
        break;
      default:
        newNode = createTextNode(`来自知识树-${branchId}`, position);
    }
    
    setNodes((els) => els.concat(newNode));
    toast({
      title: '已创建节点',
      description: `已从知识树分支创建${nodeType}类型节点`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // 添加节点对齐功能
  const alignSelectedNodes = (direction: 'horizontal' | 'vertical') => {
    const selectedNodes = nodes.filter(node => node.isSelected);
    
    if (selectedNodes.length <= 1) {
      toast({
        title: "无法对齐节点",
        description: "请选择至少两个节点进行对齐",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    saveToHistory();
    
    // 计算平均位置
    let alignPosition = 0;
    
    if (direction === 'horizontal') {
      // 水平对齐 - 计算所有选中节点的平均Y坐标
      alignPosition = selectedNodes.reduce((sum, node) => sum + node.position.y, 0) / selectedNodes.length;
      
      setNodes(nodes.map(node => {
        if (node.isSelected) {
          return {
            ...node,
            position: {
              ...node.position,
              y: alignPosition
            }
          };
        }
        return node;
      }));
    } else {
      // 垂直对齐 - 计算所有选中节点的平均X坐标
      alignPosition = selectedNodes.reduce((sum, node) => sum + node.position.x, 0) / selectedNodes.length;
      
      setNodes(nodes.map(node => {
        if (node.isSelected) {
          return {
            ...node,
            position: {
              ...node.position,
              x: alignPosition
            }
          };
        }
        return node;
      }));
    }
    
    toast({
      title: `已${direction === 'horizontal' ? '水平' : '垂直'}对齐节点`,
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 添加自动布局功能
  const autoArrangeNodes = () => {
    if (nodes.length <= 1) {
      toast({
        title: "无法自动布局",
        description: "节点数量不足",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    saveToHistory();
    
    // 简单的力导向布局算法
    // 这里实现一个简化版本，实际项目中可以使用更复杂的算法
    
    // 计算画布中心
    const centerX = window.innerWidth / 2 / zoom - position.x / zoom;
    const centerY = window.innerHeight / 2 / zoom - position.y / zoom;
    
    // 节点间距
    const nodeDistance = 250;
    
    // 计算节点新位置
    const newNodes = [...nodes];
    
    // 如果节点数量少于等于5，使用环形布局
    if (nodes.length <= 5) {
      const radius = nodeDistance;
      const angleStep = (2 * Math.PI) / nodes.length;
      
      newNodes.forEach((node, index) => {
        const angle = index * angleStep;
        node.position = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      });
    } 
    // 否则使用网格布局
    else {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const rows = Math.ceil(nodes.length / cols);
      
      const startX = centerX - (cols * nodeDistance) / 2;
      const startY = centerY - (rows * nodeDistance) / 2;
      
      newNodes.forEach((node, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        node.position = {
          x: startX + col * nodeDistance,
          y: startY + row * nodeDistance
        };
      });
    }
    
    setNodes(newNodes);
    
    toast({
      title: "已自动布局节点",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };
  
  // 添加创建节点的辅助函数
  const createTextNode = (content: string, position?: { x: number, y: number }) => {
    const id = `node${nodes.length + 1}`;
    const nodePosition = position || { 
      x: window.innerWidth / 2 / zoom - position.x / zoom - 100, 
      y: window.innerHeight / 2 / zoom - position.y / zoom - 60 
    };
    
    // 修改这里，避免使用未定义的position
    const defaultPosition = { 
      x: window.innerWidth / 2 / zoom - 100, 
      y: window.innerHeight / 2 / zoom - 60 
    };
    
    const finalPosition = position || {
      x: defaultPosition.x - (position ? position.x / zoom : 0),
      y: defaultPosition.y - (position ? position.y / zoom : 0)
    };
    
    return {
      id,
      type: 'text',
      position: finalPosition,
      content: content || '新文本节点',
      isSelected: true
    };
  };
  
  const createImageNode = (imageUrl: string, position?: { x: number, y: number }) => {
    const id = `node${nodes.length + 1}`;
    
    // 创建默认位置，不依赖于可能未定义的position
    const defaultPosition = { 
      x: window.innerWidth / 2 / zoom - 100, 
      y: window.innerHeight / 2 / zoom - 60 
    };
    
    return {
      id,
      type: 'image',
      position: position || defaultPosition,
      content: '图片节点',
      data: {
        url: imageUrl || 'https://via.placeholder.com/150'
      },
      isSelected: true
    };
  };
  
  const createLinkNode = (url: string, position?: { x: number, y: number }) => {
    const id = `node${nodes.length + 1}`;
    
    // 创建默认位置，不依赖于可能未定义的position
    const defaultPosition = { 
      x: window.innerWidth / 2 / zoom - 100, 
      y: window.innerHeight / 2 / zoom - 60 
    };
    
    return {
      id,
      type: 'link',
      position: position || defaultPosition,
      content: url || 'https://example.com',
      data: {
        url: url || 'https://example.com'
      },
      isSelected: true
    };
  };
  
  const createChatNode = (prompt: string, position?: { x: number, y: number }) => {
    const id = `node${nodes.length + 1}`;
    
    // 创建默认位置，不依赖于可能未定义的position
    const defaultPosition = { 
      x: window.innerWidth / 2 / zoom - 100, 
      y: window.innerHeight / 2 / zoom - 60 
    };
    
    return {
      id,
      type: 'ai',
      position: position || defaultPosition,
      content: prompt || '请输入您的问题...',
      data: {
        response: '',
        model: 'gpt-4'
      },
      isSelected: true
    };
  };
  
  const createDebateNode = (topic: string, position?: { x: number, y: number }) => {
    const id = `node${nodes.length + 1}`;
    
    // 创建默认位置，不依赖于可能未定义的position
    const defaultPosition = { 
      x: window.innerWidth / 2 / zoom - 150, 
      y: window.innerHeight / 2 / zoom - 100 
    };
    
    return {
      id,
      type: 'debate',
      position: position || defaultPosition,
      content: topic || '添加辩论话题',
      data: {
        topic: topic || '',
        perspectives: [],
        analysis: '',
        persuasiveView: '',
        settings: {
          debateStyle: 'balanced',
          complexity: 'moderate',
          model: 'gpt-4'
        }
      },
      isSelected: true
    };
  };
  
  const createPortNode = (title: string, position?: { x: number, y: number }) => {
    const id = `node${nodes.length + 1}`;
    
    // 创建默认位置，不依赖于可能未定义的position
    const defaultPosition = { 
      x: window.innerWidth / 2 / zoom - 150, 
      y: window.innerHeight / 2 / zoom - 100 
    };
    
    return {
      id,
      type: 'port',
      position: position || defaultPosition,
      content: '',
      data: {
        title: title || '处理模块',
        description: '用于处理数据的节点',
        content: '这是一个处理模块节点，可以通过输入端口接收数据，经过处理后从输出端口发送结果。',
        inputs: [
          {
            id: `port-in-${Date.now()}-1`,
            name: '输入 1',
            type: 'data',
            direction: 'input',
            dataType: 'any',
            connections: [],
            position: { x: 0, y: 0 }
          }
        ],
        outputs: [
          {
            id: `port-out-${Date.now()}-1`,
            name: '输出 1',
            type: 'data',
            direction: 'output',
            dataType: 'any',
            connections: [],
            position: { x: 0, y: 0 }
          }
        ],
        process: 'function process(input) {\n  return input;\n}',
        format: 'markdown'
      },
      isSelected: true
    };
  };
  
  const createBionicTextNode = (text: string, position?: { x: number, y: number }) => {
    const id = `node${nodes.length + 1}`;
    
    // 创建默认位置，不依赖于可能未定义的position
    const defaultPosition = { 
      x: window.innerWidth / 2 / zoom - 150, 
      y: window.innerHeight / 2 / zoom - 100 
    };
    
    return {
      id,
      type: 'bionicText',
      position: position || defaultPosition,
      content: text || '这是一个仿生阅读测试文本。仿生阅读通过强调单词前部分来帮助您更快地阅读和理解文本内容。这种技术可以提高阅读速度和阅读效率。',
      data: {},
      isSelected: true
    };
  };
  
  // 添加打开多节点查询的函数
  const openMultiNodeAnalysis = () => {
    const hasSelectedNodes = nodes.filter(node => node.isSelected).length > 0;
    
    if (!hasSelectedNodes) {
      toast({
        title: "请先选择节点",
        description: "需要选择至少一个节点来进行多节点分析",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    setIsMultiNodeQueryOpen(true);
  };
  
  // 添加打开AI设置的函数
  const openAISettings = () => {
    setIsAISettingsOpen(true);
  };
  
  // 添加关闭多节点查询的函数
  const closeMultiNodeQuery = () => {
    setIsMultiNodeQueryOpen(false);
  };
  
  // 添加关闭AI设置的函数
  const closeAISettings = () => {
    setIsAISettingsOpen(false);
  };
  
  // 添加从多节点分析创建节点的函数
  const handleCreateNodeFromAnalysis = (nodeData: any) => {
    saveToHistory();
    
    let newNode;
    
    if (typeof nodeData === 'string') {
      // 兼容旧版本的调用方式
      const content = nodeData;
      const nodeType = arguments[1] || 'ai';
      
      switch (nodeType) {
        case 'text':
          newNode = createTextNode(content);
          break;
        case 'bionic':
          newNode = createBionicTextNode(content);
          break;
        case 'ai':
        default:
          newNode = createChatNode(content);
          break;
      }
    } else {
      // 新版本直接传递节点数据
      switch (nodeData.type) {
        case 'text':
          newNode = createTextNode(nodeData.data?.content || nodeData.content);
          break;
        case 'bionic':
          newNode = createBionicTextNode(nodeData.data?.content || nodeData.content);
          break;
        case 'debate':
          newNode = createDebateNode(nodeData.data?.topic || nodeData.content);
          break;
        case 'port':
          newNode = createPortNode(nodeData.content);
          break;
        case 'ai':
        default:
          newNode = createChatNode(nodeData.data?.content || nodeData.content);
          break;
      }
    }
    
    // 更新节点状态，取消选择其他节点
    setNodes([
      ...nodes.map(node => ({ ...node, isSelected: false })),
      newNode
    ]);
    
    // 如果节点数据中包含连接设置，则创建连接
    if (nodeData.data?.sourceNodeIds && nodeData.data?.createConnections) {
      const sourceNodeIds = nodeData.data.sourceNodeIds;
      const connectionType = nodeData.data.connectionType || 'direct';
      const bidirectional = nodeData.data.bidirectional || false;
      
      // 创建从源节点到新节点的连接
      sourceNodeIds.forEach((sourceId: string) => {
        // 检查源节点是否存在
        const sourceNode = nodes.find(node => node.id === sourceId);
        if (!sourceNode) return;
        
        // 创建连接
        const newConnection = {
          id: `conn${connections.length + 1}`,
          source: sourceId,
          target: newNode.id,
          type: connectionType,
          style: getDefaultStyleForType(connectionType)
        };
        
        setConnections(prev => [...prev, newConnection]);
        
        // 如果是双向连接，再创建反向连接
        if (bidirectional) {
          const reverseConnection = {
            id: `conn${connections.length + 2}`,
            source: newNode.id,
            target: sourceId,
            type: connectionType,
            style: getDefaultStyleForType(connectionType)
          };
          
          setConnections(prev => [...prev, reverseConnection]);
        }
      });
      
      toast({
        title: "已创建节点和连接",
        description: `已创建分析结果节点并与${sourceNodeIds.length}个源节点建立连接`,
        status: "success",
        duration: 1500,
        isClosable: true,
      });
    } else {
      toast({
        title: "已创建分析结果节点",
        status: "success",
        duration: 1500,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box>
      {/* 组件内容 */}
    </Box>
  );
};

export default GraphPage; 