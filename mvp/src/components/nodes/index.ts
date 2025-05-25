import TextNode from './TextNode';
import ImageNode from './ImageNode';
import LinkNode from './LinkNode';
import AINode from './AINode';
import QuestionNode from './QuestionNode';
import AnswerNode from './AnswerNode';
import DebateNode from './DebateNode';
import PortNode from './PortNode';
import BionicTextNode from './BionicTextNode';
import AIAgentNode from './AIAgentNode';

// 节点类型到组件的映射
const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  link: LinkNode,
  ai: AINode,
  question: QuestionNode,
  answer: AnswerNode,
  debate: DebateNode,
  port: PortNode,
  bionic: BionicTextNode,
  aiagent: AIAgentNode,
  // 未来会添加更多节点类型
  // code: CodeNode
};

export default nodeTypes;

export type NodeType = keyof typeof nodeTypes;

// 判断节点类型是否有效
export const isValidNodeType = (type: string): type is NodeType => {
  return Object.keys(nodeTypes).includes(type);
};

// 根据节点类型获取对应的组件
export const getNodeComponent = (type: string) => {
  if (isValidNodeType(type)) {
    return nodeTypes[type];
  }
  return TextNode; // 默认返回文本节点作为后备
}; 