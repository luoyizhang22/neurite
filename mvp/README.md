# Neurite-Storm: AI头脑风暴工具

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)

## 📖 项目介绍

Neurite-Storm是一个以人为本的AI头脑风暴工具，旨在改变传统线性思考和学习模式，提供非线性、结构化的知识管理和创意发散系统。核心理念是将人类思维的发散性与AI的逻辑性相结合，创造更自然、更高效的思考辅助工具。

### 核心痛点解决

1. **非线性知识探索**：突破传统聊天界面的线性局限，支持任意节点回溯和多向延伸
2. **结构化认知表达**：使用可视化思维导图呈现知识结构，每个节点具有清晰的关联关系
3. **仿生式阅读体验**：优化文本呈现方式，提升阅读效率和理解深度
4. **AI辩论式互动**：支持多角度AI观点对比，激发更深入的思考
5. **个体化知识管理**：与用户知识水平同步，进行更精准的交流和辅助

## 🔍 核心功能

| 功能模块 | 描述 |
|---------|------|
| **知识节点系统** | 支持多种节点类型（文本、问题、回答、AI生成等），每个节点可包含丰富元数据 |
| **思维图谱可视化** | 基于React Flow的关系可视化系统，支持多种连接类型和布局算法 |
| **仿生式阅读** | 增强文本可读性的处理系统，支持重点突出和三栏式阅读布局 |
| **AI互动系统** | 多模式AI交互（对话、辩论、苏格拉底式问答），支持多节点联合查询 |
| **知识模块化** | 基于达朗贝尔知识树的分层知识管理，支持折叠/展开操作 |

## 🔄 最新更新功能

### 2023.7.19 更新：AI服务架构全面优化

在本次更新中，我们对AI服务架构进行了全面优化，显著提高了系统稳定性、性能和用户体验：

1. **智能API选择机制**：
   - 新增`shouldUseChatAPI`方法，根据消息内容和模型类型自动选择最合适的API端点
   - 针对不同模型（Qwen、Llama、Mistral、Gemma、Phi等）优化提示词格式
   - 自动识别多轮对话场景，选择chat API而非generate API
   - 为每种模型提供专门的格式化逻辑，确保最佳兼容性

2. **统一的重试机制**：
   - 重构`ollamaRequestWithRetry`方法，采用策略模式设计多级重试
   - 按优先级尝试不同的API调用方式，确保最高成功率
   - 智能退避策略，避免频繁重试对服务造成压力
   - 详细的错误诊断和日志记录，便于问题排查

3. **增强的响应处理**：
   - 改进`processResponse`方法，支持多种响应格式
   - 新增`extractTextFromStreamResponse`方法，正确处理流式响应
   - 智能识别不同API返回的数据结构，提取有效内容
   - 优化错误处理，提供更友好的错误消息

4. **代理服务器优化**：
   - 改进流式响应处理，确保数据完整性
   - 优化请求体处理，确保stream参数正确设置
   - 增强错误诊断，提供更详细的问题分析
   - 调整超时设置，适应大型模型生成需求

5. **组件集成优化**：
   - 简化DebateAssistant和MultiNodeQuery组件中的AI调用逻辑
   - 移除冗余的重试代码，使用统一的重试机制
   - 改进用户界面反馈，提供更清晰的进度和错误提示
   - 优化加载状态管理，提升用户体验

通过这些优化，我们显著提高了系统与Ollama服务的通信稳定性和可靠性，特别是在网络波动或服务临时不可用的情况下，能够提供更好的用户体验和错误恢复能力。同时，代码结构更加清晰，维护性更高，为未来功能扩展奠定了坚实基础。

### 2023.7.18 更新：全面增强的Ollama连接与错误处理

在本次更新中，我们对Ollama API调用和代理服务器配置进行了全面优化，显著提高了系统稳定性和用户体验：

1. **增强的Ollama请求机制**：
   - 实现了`ollamaRequestWithRetry`方法，提供智能重试和多级错误恢复策略
   - 添加指数退避策略，避免频繁重试对服务造成压力
   - 针对不同类型的错误采取不同的处理策略，提高恢复成功率
   - 在所有重试失败后，自动尝试备用的Python风格请求方法
   - 提供详细的错误诊断信息，帮助用户快速定位问题

2. **代理服务器健康检查与优化**：
   - 添加自动服务健康检查，在应用启动时和运行期间定期检查Ollama服务状态
   - 优化代理配置，支持WebSocket、延长超时时间、配置CORS等
   - 实现全面的错误处理，捕获并处理代理请求过程中的各种错误
   - 根据响应内容类型采用不同的处理策略，确保数据正确传输
   - 提供详细的请求日志，便于监控和调试

3. **组件集成优化**：
   - 更新DebateAssistant组件，使用增强的`ollamaRequestWithRetry`方法替代旧的直接调用
   - 更新AINode组件，同样采用增强的请求方法，提高连接成功率
   - 优化错误提示，提供更友好的用户体验

4. **文档完善**：
   - 在README.md中添加详细的技术实现文档，包括代码示例和关键特性说明
   - 提供代理服务器配置的详细说明，便于开发者理解和定制

通过这些优化，我们显著降低了用户遇到"Network Error"等连接问题的概率，提高了系统整体稳定性和用户体验，特别是在网络波动或服务临时不可用的情况下，能够提供更好的错误恢复能力。

### 2023.7.17 更新：Ollama请求重试机制

### 增强的多节点分析系统

我们全面升级了多节点分析系统，现在支持更多类型的节点内容分析，包括：

- **混合节点分析**：同时分析文本、图像、AI对话、辩论和链接等多种类型的节点
- **图像节点支持**：可以将图像节点与文本节点结合进行分析，系统会提取图像描述和URL
- **多种分析模式**：
  - 比较分析：对比多个节点内容的异同点
  - 综合分析：整合多个节点的信息形成更高层次的理解
  - 关系探索：发现节点内容之间的潜在联系
  - 辩论式思考：从多角度分析支持和反对的观点
  - 自定义查询：使用自定义提示词进行分析

### 自适应智能提示词系统 (2023.8 新增)

我们完全重构了提示词构建系统，使其能够智能适应不同类型和复杂度的卡片内容：

- **内容复杂度分析**：系统会自动分析节点内容的复杂度，根据文本长度、关键词和内容类型进行评估
- **基于内容特征的提示词生成**：根据内容复杂度和类型自动调整提示词深度和关注点
- **多维度提示词优化**：
  - 针对简单内容：生成简洁明了的分析，适合快速理解
  - 针对中等复杂度：提供更详细的分析，平衡深度和可读性
  - 针对复杂内容：生成深入全面的分析，包含多层次思考和背景信息
- **内容类型感知**：针对不同类型的节点内容(文本、图片、链接、辩论等)自动调整分析重点

### 增强的辩论助手系统

辩论助手系统也进行了全面升级：

- **多类型输入支持**：可以基于文本、图像、链接等多种类型的节点生成辩论观点
- **智能观点生成**：根据话题和节点内容自动生成多个不同角度的观点
- **辩论风格选择**：
  - 平衡式：提供平衡的支持和反对观点
  - 对抗式：突出不同立场之间的矛盾和冲突
  - 苏格拉底式：通过提问引导深入思考
- **复杂度调节**：可以调整辩论分析的复杂度，从简洁到全面深入
- **观点提取优化**：智能从AI回复中提取结构化的观点列表
- **辩论历史记录**：自动保存最近的辩论分析结果，方便后续查看和比较

### 优化的AI服务集成 (2023.8 新增)

- **Ollama本地模型支持**：添加对Ollama本地大语言模型的支持，降低API成本并增强隐私保护
- **智能API调用策略**：
  - 直接调用优先：优先使用更高效的直接调用方式
  - 自动失败恢复：若直接调用失败，自动回退到标准调用方法
  - 动态令牌分配：根据内容复杂度自动调整最大令牌数
  - 详细性能监控：记录API调用耗时、成功率和错误类型
- **增强的错误处理**：更全面的错误捕获、日志记录和用户友好的错误提示
- **统一API接口**：所有AI功能使用统一的接口，便于扩展和维护
- **提示词构建优化**：通过PromptBuilder构建更有效的提示词
- **多模型支持**：支持在不同分析任务中选择不同的AI模型
- **增强的Ollama连接诊断** (2023.9 新增)：
  - 多方式连接尝试：自动尝试多种连接方法，提高连接成功率
  - 详细网络诊断：提供清晰的网络连接状态和错误原因分析
  - 用户友好错误提示：将技术错误转换为可操作的用户指导
  - 自动服务检测：在请求前自动验证服务可用性
  - 模型可用性测试：检测模型是否已安装并可用
- **多层次请求失败恢复** (2023.9 新增)：
  - 多种API调用方式：支持chat API、generate API和Python风格API调用
  - 智能重试机制：在请求失败时自动尝试不同的调用方式
  - 渐进式降级策略：从高级API到基础API的平滑降级
  - 详细请求日志：记录每次请求的详细信息，便于调试
  - 用户反馈机制：在重试过程中提供清晰的状态更新

## 使用指南

### 多节点分析功能

1. 在图谱中选择一个或多个节点
2. 点击工具栏中的"多节点分析"按钮
3. 选择分析类型（比较、综合、关系探索、辩论式思考或自定义）
4. 根据需要调整高级设置（温度、详细程度等）
5. 点击"执行分析"按钮
6. 查看分析结果，满意后点击"创建节点"将结果保存为新节点

### 辩论助手功能

1. 在图谱中选择一个或多个节点
2. 点击工具栏中的"辩论助手"按钮
3. 确认或修改讨论话题
4. 点击"生成观点"按钮，系统会生成多个不同角度的观点
5. 选择你感兴趣的观点（至少选择两个）
6. 点击"生成辩论分析"按钮
7. 查看辩论分析结果，满意后点击"保存到图谱"将结果保存为新节点

## 🛠️ 技术架构

### 技术选型

- **前端框架**: React + TypeScript
- **状态管理**: Redux Toolkit
- **UI组件库**: Chakra UI / Ant Design
- **图形可视化**: React Flow + D3.js
- **文本处理**: 自定义仿生阅读算法
- **AI集成**: OpenAI API / Langchain
- **数据存储**: IndexedDB / LocalStorage
- **构建工具**: Vite

### 系统架构图

```
+---------------------------------------------+
|                  用户界面层                   |
| +-------------------+ +-------------------+ |
| |    思维图谱组件     | |    节点编辑器组件   | |
| +-------------------+ +-------------------+ |
| +-------------------+ +-------------------+ |
| |   仿生阅读组件     | |     AI交互组件     | |
| +-------------------+ +-------------------+ |
+---------------------------------------------+
|                  业务逻辑层                   |
| +-------------------+ +-------------------+ |
| |   节点管理服务     | |   关系管理服务     | |
| +-------------------+ +-------------------+ |
| +-------------------+ +-------------------+ |
| |   AI服务适配器     | |   知识树服务      | |
| +-------------------+ +-------------------+ |
+---------------------------------------------+
|                  数据持久层                   |
| +-------------------+ +-------------------+ |
| |   IndexedDB存储   | |  本地文件导入导出  | |
| +-------------------+ +-------------------+ |
+---------------------------------------------+
```

## 🛠️ 技术实现细节

### 增强的Ollama请求重试机制

最新版本中，我们实现了更强大的Ollama请求机制，通过智能重试和多级错误恢复策略，解决网络错误和连接问题：

```typescript
/**
 * 带有高级重试机制的Ollama请求方法
 * @param model 模型名称，例如"qwen2.5:7b"
 * @param messages 消息数组，包含role和content
 * @param temperature 温度参数，控制随机性，默认0.7
 * @returns 包含生成文本和请求ID的对象
 */
public async ollamaRequestWithRetry(
  model: string, 
  messages: Message[], 
  temperature: number = 0.7
): Promise<{ text: string; requestId: string }> {
  const requestId = `ollama_retry_${Date.now()}`;
  const startTime = Date.now();
  
  // 定义重试参数
  const maxRetries = 3;
  const initialBackoff = 500; // 初始等待时间（毫秒）
  let attempt = 0;
  
  // 捕获所有重试过程中的错误，以便提供更好的诊断
  const errors: any[] = [];
  
  while (attempt <= maxRetries) {
    try {
      // 调用原始方法
      const response = await this.sendDirectOllamaRequest(model, messages, temperature);
      return response;
    } catch (error) {
      attempt++;
      
      // 针对不同类型的错误设定不同的处理策略
      if (errorMessage.includes('Network Error')) {
        // 对于连接问题，尝试重新测试连接
        await this.testOllamaConnection(model, false);
      }
      
      if (attempt <= maxRetries) {
        // 指数退避策略
        const backoff = initialBackoff * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }
  
  // 尝试备用方法 - 使用Python风格的请求
  try {
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const userContent = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');
      
    const backupResponse = await this.pythonStyleOllamaRequest(
      userContent,
      model,
      systemPrompt
    );
    
    return {
      text: backupResponse,
      requestId: requestId + '_backup'
    };
  } catch (backupError) {
    // 构造详细的错误报告
    throw new Error(`Ollama请求在多次尝试后失败。请检查Ollama服务是否正在运行。`);
  }
}
```

这个方法具有以下关键特性：

1. **智能重试机制**：在遇到网络错误或服务不可用时自动重试，最多尝试3次
2. **指数退避策略**：每次重试之间的等待时间会逐渐增加，避免对服务造成过多压力
3. **错误适应**：根据不同类型的错误采取不同的处理策略
4. **多级失败恢复**：如果常规方法全部失败，会自动尝试备用的Python风格请求方法
5. **详细错误诊断**：收集所有重试过程中的错误信息，提供全面的错误报告

通过这种方法，我们显著降低了用户遇到"Network Error"等连接问题的概率，提高了系统整体稳定性和用户体验。

### 代理服务器健康检查与优化

为了解决网络连接问题和提高系统稳定性，我们对代理服务器配置进行了全面优化：

```typescript
// vite.config.ts 中的代理服务器优化配置
export default defineConfig({
  // ... 其他配置 ...
  server: {
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        secure: false,
        ws: true, // 支持WebSocket
        proxyTimeout: 180000, // 3分钟超时
        timeout: 180000, // 匹配proxyTimeout
        followRedirects: true,
        autoRewrite: true,
        xfwd: true, // 转发原始IP
        rewrite: (path) => {
          console.log(`[代理请求]: ${path}`);
          return path.replace(/^\/api\/ollama/, '/api');
        },
        configure: (proxy, options) => {
          // 请求前处理
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[代理请求开始]: ${req.method} ${req.url}`);
          });
          
          // 响应处理
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const statusCode = proxyRes.statusCode;
            console.log(`[代理响应]: ${req.method} ${req.url} - 状态码: ${statusCode}`);
            
            // 检查响应内容类型
            const contentType = proxyRes.headers['content-type'] || '';
            
            if (contentType.includes('application/json')) {
              console.log(`JSON响应: ${req.url}`);
              
              // 对JSON响应进行处理...
            } else if (contentType.includes('text/event-stream')) {
              console.log(`流式响应: ${req.url}`);
              
              // 流式响应处理...
            }
          });
          
          // 错误处理
          proxy.on('error', (err, req, res) => {
            console.error(`[代理错误]: ${req.method} ${req.url} - ${err.message}`);
            
            // 向客户端返回友好的错误信息
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: '代理服务器错误',
                message: '无法连接到Ollama服务，请确保服务正在运行',
                code: 'PROXY_ERROR',
                details: err.message
              }));
            }
          });
        }
      }
    },
    cors: {
      origin: '*', // 允许所有域的跨域请求
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    // 添加服务器启动和运行时的Ollama服务检测
    onBeforeMiddleware: async (server) => {
      // 在服务器启动时检查Ollama服务可用性
      console.log('正在检查Ollama服务可用性...');
      
      const checkOllamaService = () => {
        console.log(`[${new Date().toLocaleTimeString()}] 检查Ollama服务状态...`);
        
        // 使用http模块直接发送请求，避免依赖axios等库
        const http = require('http');
        const req = http.get('http://localhost:11434/api/tags', {
          timeout: 5000
        }, (res) => {
          if (res.statusCode === 200) {
            console.log('✅ Ollama服务正常运行中');
            
            // 读取响应内容
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                const models = JSON.parse(data);
                console.log(`可用模型: ${models.models?.length || 0}个`);
              } catch (e) {
                console.log('无法解析模型列表');
              }
            });
          } else {
            console.log(`⚠️ Ollama服务返回非200状态码: ${res.statusCode}`);
          }
        });
        
        req.on('error', (err) => {
          console.log(`❌ Ollama服务检查失败: ${err.message}`);
          if (err.code === 'ECONNREFUSED') {
            console.log('👉 提示: 请确保已运行 "ollama serve" 命令启动Ollama服务');
          }
        });
        
        req.on('timeout', () => {
          console.log('⚠️ Ollama服务检查超时');
          req.destroy();
        });
      };
      
      // 立即执行一次检查
      checkOllamaService();
      
      // 设置定时检查（每分钟检查一次）
      setInterval(checkOllamaService, 60000);
    }
  },
  // ... 其他配置 ...
});
```

这个优化方案包含以下关键特性：

1. **全面的错误处理**：捕获并处理代理请求过程中的各种错误，提供详细的错误日志和用户友好的错误信息
2. **智能响应处理**：根据响应内容类型（JSON或流式）采用不同的处理策略，确保数据正确传输
3. **自动服务健康检查**：
   - 在应用启动时自动检查Ollama服务可用性
   - 定时（每分钟）检查服务状态，及时发现问题
   - 提供明确的服务状态反馈和操作建议
4. **优化的代理配置**：
   - 延长超时时间至3分钟，适应大型模型生成需求
   - 启用WebSocket支持，优化流式响应处理
   - 配置跨域资源共享(CORS)，解决浏览器安全限制
   - 启用IP转发和重定向跟踪，提高代理透明度
5. **详细的请求日志**：记录每个代理请求的完整生命周期，便于监控和调试

通过这些优化，我们显著提高了系统与Ollama服务通信的稳定性和可靠性，特别是在网络波动或服务临时不可用的情况下，能够提供更好的用户体验和错误恢复能力。

### 自适应智能提示词系统

最新版本中，我们实现了一个全新的自适应提示词构建系统，可以根据内容特征动态调整提示词策略：

```typescript
// 分析内容复杂度
private static analyzeContentComplexity(contents: ExtractedContent[]): 'simple' | 'moderate' | 'complex' {
  // 计算平均内容长度
  const avgLength = contents.reduce((sum, content) => sum + content.text.length, 0) / contents.length;
  
  // 检查是否包含复杂概念的关键词
  const complexityIndicators = [
    "理论", "框架", "系统", "哲学", "方法论", "机制", "复杂", "多维", 
    "辩证", "分析", "综合", "批判", "评估", "比较", "量化", "质化"
    // ... 其他指示复杂度的关键词
  ];
  
  // 基于多种因素计算复杂度评分
  let complexityScore = 0;
  
  // 根据总分确定复杂度
  if (avgScore < 1.5) return 'simple';
  if (avgScore < 2.5) return 'moderate';
  return 'complex';
}

// 构建比较分析提示词
private static buildComparePrompt(
  contents: ExtractedContent[], 
  formattedContents: string,
  complexity: 'simple' | 'moderate' | 'complex',
  types: Set<string>
): string {
  let prompt = `比较以下${contents.length}个概念之间的异同点:\n\n${formattedContents}\n\n`;
  
  // 根据内容复杂度调整比较深度
  if (complexity === 'simple') {
    prompt += "请提供清晰简洁的比较，重点关注最明显的异同点...";
  } else if (complexity === 'moderate') {
    prompt += "请提供详细的比较分析，包括定义、特征、功能/用途和关键差异...";
  } else {
    prompt += "请提供全面深入的比较分析，包括历史背景、理论基础、核心概念...";
  }
  
  // 根据内容类型添加特定指导
  if (types.has('图片')) {
    prompt += "\n对于图片内容，请关注视觉元素、构图、色彩、风格等方面的比较。";
  }
  
  return prompt;
}
```

### 增强的Ollama连接与请求处理 (2023.9 新增)

在最新版本中，我们全面增强了Ollama连接诊断和请求处理机制，提供更可靠的本地AI服务：

```typescript
/**
 * 测试Ollama连接 - 尝试多种方式建立连接
 */
public async testOllamaConnection(
  model: string = "qwen2.5:7b",
  includeModelTest: boolean = true
): Promise<boolean> {
  console.log(`开始测试Ollama连接，目标模型: ${model}`);
  console.log(`浏览器环境: ${navigator.userAgent}`);
  console.log(`网络环境: 协议 ${window.location.protocol}, 主机 ${window.location.host}`);
  
  // 记录测试时间和尝试次数
  const startTime = Date.now();
  let attempts = 1;
  let useProxy = false;
  
  try {
    // 尝试多种连接方式
    const connectionMethods = [
      { name: "直接连接", url: "http://localhost:11434/api/tags", directConnect: true },
      { name: "代理连接", url: "/api/ollama/tags", directConnect: false }
    ];
    
    let isConnected = false;
    let connectionDetails: { 
      method: string; 
      url: string; 
      responseTime: number; 
      models: any[] 
    } | null = null;
    
    // 遍历尝试不同的连接方式
    for (const method of connectionMethods) {
      try {
        console.log(`尝试 ${method.name} 到 ${method.url}`);
        const response = await axios.get(method.url, { 
          timeout: 5000,
          headers: { 'Accept': 'application/json' }
        });
        
        // 检查是否成功
        if (response.status === 200) {
          console.log(`${method.name}成功! 状态码: ${response.status}`);
          console.log(`可用模型: ${JSON.stringify(response.data?.models || response.data || '未返回模型列表')}`);
          
          // 保存连接详情
          isConnected = true;
          connectionDetails = {
            method: method.name,
            url: method.url,
            responseTime: Date.now() - startTime,
            models: response.data?.models || []
          };
          
          // 设置是否使用代理
          useProxy = !method.directConnect;
          
          // 找到成功的连接方法，跳出循环
          break;
        }
      } catch (methodError) {
        console.warn(`${method.name}失败: ${methodError.message}`);
      }
    }
    
    // 如果所有连接尝试都失败
    if (!isConnected) {
      throw new Error(
        '无法连接到Ollama服务。请确保:\n' +
        '1. Ollama已安装并运行 (运行命令 "ollama serve")\n' +
        '2. 服务默认端口11434未被占用或阻止\n' +
        '3. 如果在不同机器上，需要设置OLLAMA_HOST环境变量\n' +
        '4. 检查防火墙或代理设置是否阻止了连接'
      );
    }
    
    // 如果需要，测试模型调用
    if (includeModelTest) {
      try {
        console.log(`测试模型 "${model}" 可用性...`);
        
        // 根据是否使用代理选择URL
        const apiUrl = useProxy ? '/api/ollama/chat' : 'http://localhost:11434/api/chat';
        
        // 构造简单的测试请求
        const testRequest = {
          model: model,
          messages: [{ role: "user", content: "Hello, this is a connection test." }],
          stream: false,
          options: {
            temperature: 0.01,
            num_predict: 10
          }
        };
        
        // 发送请求
        const modelResponse = await axios.post(apiUrl, testRequest, { 
          headers: { 'Content-Type': 'application/json' }, 
          timeout: 10000 
        });
        
        // 判断是否成功
        if (modelResponse.status === 200) {
          console.log('模型测试成功!');
        }
      } catch (modelError) {
        // 模型测试失败，但连接测试已成功
        console.warn(`模型测试失败: ${modelError.message}`);
        
        // 如果是404，模型可能不存在
        if (modelError.response?.status === 404) {
          console.warn(`模型 "${model}" 可能未安装，请使用 "ollama pull ${model}" 命令下载`);
        }
      }
    }
    
    return true;
  } catch (error) {
    // 提供明确的错误原因和解决方案
    let errorMessage = `无法连接到Ollama服务: ${error.message}`;
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '连接被拒绝：Ollama服务可能未运行。请运行 "ollama serve" 命令启动服务。';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '连接超时：Ollama服务响应时间过长或网络问题。请检查网络连接或服务器负载。';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * 多层次请求失败恢复机制在辩论分析生成中的应用
 */
const generateDebateAnalysis = async () => {
  // ... 前置代码 ...
  
  let response;
  let retryCount = 0;
  const maxRetries = 3;
  
  // 添加重试机制
  while (retryCount <= maxRetries) {
    try {
      if (retryCount === 0) {
        // 首先尝试直接调用chat方法
        console.log(`尝试使用chat API调用 ${selectedModel} 模型...`);
        
        try {
          const chatText = await aiService.ollamaChatCompletion(messages, selectedModel);
          response = { text: chatText, requestId: 'chat_api_call' };
          break; // 成功，跳出重试循环
        } catch (chatError) {
          console.error('chat API调用失败，尝试下一种方法:', chatError);
          retryCount++;
        }
      } else if (retryCount === 1) {
        // 第一次重试：尝试使用Python风格的直接调用
        console.log(`尝试使用Python风格调用 ${selectedModel} 模型...`);
        
        try {
          const pythonStylePrompt = `${systemPrompt}\n\n${userPrompt}`;
          const directText = await aiService.pythonStyleOllamaRequest(pythonStylePrompt, selectedModel);
          response = { text: directText, requestId: 'python_style_call' };
          break; // 成功，跳出重试循环
        } catch (directError) {
          console.error('Python风格调用失败，尝试最后一种方法:', directError);
          retryCount++;
        }
      } else if (retryCount === 2) {
        // 第二次重试：尝试使用旧方法直接调用
        console.log(`尝试使用旧方法直接调用 ${selectedModel} 模型...`);
        
        try {
          const oldDirectResponse = await aiService.sendDirectOllamaRequest(
            selectedModel,
            messages,
            tempSetting
          );
          
          response = oldDirectResponse;
          break; // 成功，跳出重试循环
        } catch (oldError) {
          console.error('旧方法直接调用失败，尝试最后的方法:', oldError);
          retryCount++;
        }
      } else {
        // 最后尝试使用标准方法
        console.log(`最后尝试使用标准方法...`);
        
        const standardResponse = await aiService.sendRequest({
          model: selectedModel,
          messages,
          temperature: tempSetting,
          maxTokens,
          provider: 'ollama'
        });
        
        response = standardResponse;
        break; // 成功，跳出重试循环
      }
    } catch (error) {
      // 如果这是最后一次重试，则抛出错误
      if (retryCount === maxRetries) {
        throw new Error(`所有生成方法均失败: ${error.message}`);
      }
      
      // 增加重试计数并等待一段时间后重试
      retryCount++;
      await new Promise(r => setTimeout(r, 1000 * retryCount));
    }
  }
  
  // ... 后续处理代码 ...
};
```

### Ollama API集成

我们优化了与Ollama的集成，实现了更可靠和高效的API调用机制：

```typescript
// 直接向Ollama发送请求的方法
public async sendDirectOllamaRequest(
  model: string, 
  messages: Message[], 
  temperature: number = 0.7
): Promise<{ text: string; requestId: string }> {
  const requestId = `ollama_${Date.now()}`;
  
  try {
    console.log(`直接向Ollama发送请求，模型: ${model}`);
    
    // 首先验证Ollama服务是否可用
    try {
      const modelsCheck = await axios.get('/api/ollama/tags', { 
        timeout: 3000 
      });
      console.log('Ollama服务可用，已找到模型:', 
        modelsCheck.data?.models?.length || 0);
    } catch (checkError) {
      console.error('Ollama服务不可用:', checkError);
      throw new Error('无法连接到Ollama服务，请确保服务正在运行');
    }
    
    // 判断是使用generate API还是chat API
    const isQwenModel = model.toLowerCase().includes('qwen');
    const isLlamaModel = model.toLowerCase().includes('llama');
    const isMistralModel = model.toLowerCase().includes('mistral');
    const isChatModel = isQwenModel || isLlamaModel || isMistralModel;
    
    let apiEndpoint = isChatModel ? '/api/ollama/chat' : '/api/ollama/generate';
    let requestData: any = {};
    
    // 根据API端点构造不同的请求数据
    if (apiEndpoint === '/api/ollama/chat') {
      // 使用chat API
      requestData = {
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: false,
        options: {
          temperature
        }
      };
    } else {
      // 使用generate API
      const prompt = this.formatMessagesToPrompt(messages, model);
      requestData = {
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_predict: 4096
        }
      };
    }
    
    // 发送请求，使用显式的请求配置
    const response = await axios({
      method: 'POST',
      url: apiEndpoint,
      headers: { 'Content-Type': 'application/json' },
      data: requestData,
      timeout: 120000, // 增加到120秒超时
      responseType: 'json'
    });
    
    // 根据API类型处理响应
    if (apiEndpoint === '/api/ollama/chat') {
      // chat API响应
      if (response.data && response.data.message && response.data.message.content) {
        return {
          text: response.data.message.content,
          requestId
        };
      }
    } 
    
    // generate API响应
    if (response.data && response.data.response) {
      return {
        text: response.data.response,
        requestId
      };
    }
    
    // 处理可能的其他响应格式
    // ... 省略其他处理代码 ...
    
  } catch (error) {
    console.error('直接Ollama请求失败:', error);
    
    // 构造用户友好的错误消息
    let userMessage = '与Ollama服务通信失败';
    
    if (error.message.includes('无法连接') || error.message.includes('Network Error')) {
      userMessage = '无法连接到Ollama服务。请确保Ollama正在运行，并可以通过http://localhost:11434访问。';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Ollama请求超时。这可能是因为模型较大或服务器负载过高，请稍后重试。';
    } else if (error.message.includes('404')) {
      userMessage = `找不到模型"${model}"。请确保您已经使用'ollama pull ${model}'命令下载了该模型。`;
    }
    
    throw new Error(`${userMessage} (详细错误: ${error.message})`);
  }
}
```

### 节点内容提取机制

我们实现了一个强大的内容提取器（ContentExtractor），可以从不同类型的节点中提取结构化内容：

```typescript
// 从节点中提取内容
public static extractContent(node: INode): ExtractedContent {
  // 根据节点类型提取不同的内容
  switch (node.type) {
    case 'text':
      return this.extractTextNodeContent(node as ITextNode);
    case 'image':
      return this.extractImageNodeContent(node as IImageNode);
    case 'ai':
      return this.extractAINodeContent(node as IAINode);
    // ... 其他节点类型
  }
}
```

## 🚀 未来计划

### 近期计划

- **直接图像内容理解**：集成图像识别API，直接分析图像内容而不仅仅是描述
- **多模态分析增强**：支持更多类型的内容（如音频、视频）的分析
- **个性化提示词模板**：允许用户创建和保存自定义的提示词模板
- **高级AI交互模式**：实现更复杂的AI交互模式，如多轮对话和反馈学习
- **批量节点处理**：支持批量处理大量节点，自动生成关系图谱

### 中期计划

- **AI模型自动选择**：根据任务类型自动选择最适合的AI模型
- **跨节点知识推理**：实现基于图谱结构的知识推理和发现
- **用户反馈学习系统**：根据用户反馈优化AI生成内容
- **多语言支持增强**：提供更全面的多语言分析和生成能力
- **知识树与AI分析集成**：将知识树分类与AI分析结果相结合

### 长期愿景

- **自适应学习系统**：AI助手能够学习用户的思维模式和偏好
- **协作式AI思考**：多个专业化AI代理协作解决复杂问题
- **知识图谱自动构建**：从文档和网页自动提取知识并构建图谱
- **AR/VR知识空间**：将知识图谱可视化为3D空间，支持沉浸式探索
- **脑机接口集成**：探索与未来脑机接口技术的集成可能性

## 最近更新

### 2023-07-15

- **新增ollamaChatCompletion方法**: 添加了专门用于Ollama聊天API的简化方法，提供更简洁的接口和更完善的错误处理，优化了辩论助手等需要多轮对话的功能。
- **增强的错误处理**: 为所有Ollama相关方法添加了更详细的错误诊断和用户友好的错误提示，帮助用户快速定位和解决问题。
- **优化的响应处理**: 改进了对Ollama API响应的处理逻辑，能够适应不同格式的响应，提高了系统的稳定性和可靠性。

### 2023-07-16

- 增强了网络错误处理
  - 改进了`sendDirectOllamaRequest`方法的连接检测机制，增加了多种连接尝试和重试逻辑
  - 增强了`testOllamaConnection`方法的诊断能力，添加了更详细的错误信息和网络状态检测
  - 优化了代理配置，增加了超时设置和更强大的错误处理
  - 改进了用户界面的错误提示，提供更友好的错误信息和可行的解决方案
  - 添加了一键重试连接功能，简化问题排查过程
- 提高了整体系统稳定性和用户体验

### 2023-07-17
- 添加了高级重试机制和智能退避策略
  - 新增`ollamaRequestWithRetry`方法，封装了更健壮的Ollama API调用流程
  - 实现了智能指数退避策略，在网络错误时自动延长等待时间
  - 添加了多级失败恢复机制，包括连接测试、参数调整和备用方法尝试
  - 更新了所有AI组件，使用增强的重试机制代替直接调用
  - 简化了错误消息，提供更具体的问题定位和解决建议
- 优化了服务启动检测
  - 在应用启动时自动检测Ollama服务是否可用
  - 定期进行服务健康检查，提前发现潜在问题
  - 添加了WebSocket支持，提高实时连接稳定性
- 改进了代理配置
  - 优化了CORS设置，支持更广泛的跨域请求
  - 统一了超时设置，避免因超时导致的请求失败
  - 增加了详细的请求日志，便于诊断和调试

### Ollama API调用优化 (最新)

我们对Ollama API的调用机制进行了全面优化，解决了之前直接调用失败的问题：

1. **多种API调用方式**：
   - 实现了符合Ollama官方API规范的调用方法
   - 添加了Python风格的`/generate`直接调用
   - 增强了`/chat`接口的使用，适用于对话式生成
   - 保留原有方法作为备用

2. **智能失败恢复**：
   - 多级调用策略，从最优到最稳定的方法依次尝试
   - 详细的错误记录和分析，针对不同错误类型提供不同的恢复机制
   - 针对流式响应的特殊处理，即使是不适当的流式返回也能提取完整内容

3. **流式响应处理**：
   - 明确在请求中设置`stream: false`，避免不必要的流式响应
   - 为所有可能的API提供了统一的响应解析机制
   - 增强了对流式错误响应的容错能力，从中恢复完整文本

4. **代理配置优化**：
   - 增强了Vite配置中的Ollama代理，确保流式内容正确处理
   - 实现了更详细的请求和响应日志，便于诊断问题
   - 增加了超时时间，适应大模型生成需求

### 使用说明

要使用优化后的Ollama API调用：

1. 确保Ollama服务正在运行 (`ollama serve`)
2. 确保已下载所需模型 (`ollama pull qwen2.5:7b`)
3. 启动应用并在辩论助手中使用Ollama模型

如果仍然遇到问题，可尝试以下步骤：

```bash
# 检查Ollama服务状态
curl http://localhost:11434/api/ping

# 查看可用模型
curl http://localhost:11434/api/tags

# 如果需要，重启Ollama服务
ollama serve
```

### API使用示例

以下是两种主要API调用方式：

**1. 使用Generate API (适用于直接提示词)**
```javascript
// 使用方法
const result = await aiService.pythonStyleOllamaRequest(
  "请分析这个话题的不同观点...", 
  "qwen2.5:7b"
);
```

**2. 使用Chat API (适用于多轮对话)**
```javascript
// 使用方法
const messages = [
  { role: "system", content: "你是辩论专家..." },
  { role: "user", content: "分析以下观点..." }
];
const result = await aiService.ollamaChatCompletion(
  messages, 
  "qwen2.5:7b"
);
``` 

### ollamaChatCompletion方法

为了提供更简洁的Ollama聊天API调用方式，我们实现了`ollamaChatCompletion`方法，该方法专门用于处理聊天格式的请求：

```typescript
/**
 * 使用Ollama的chat API发送聊天请求
 * @param messages 消息数组
 * @param model 模型名称
 * @param temperature 温度参数，控制随机性
 * @returns 返回AI响应文本
 */
public async ollamaChatCompletion(
  messages: Message[],
  model: string = "qwen2.5:7b",
  temperature: number = 0.7
): Promise<string>
```

#### 参数说明

- `messages`: 消息数组，包含系统、用户和助手的消息
- `model`: 模型名称，默认为"qwen2.5:7b"
- `temperature`: 温度参数，控制随机性，默认为0.7

#### 使用示例

```typescript
// 创建消息数组
const messages = [
  { role: 'system', content: '你是一个专业的辩论分析专家' },
  { role: 'user', content: '请分析以下观点的优缺点...' }
];

// 调用方法
try {
  const response = await aiService.ollamaChatCompletion(messages, 'qwen2.5:7b');
  console.log('AI回复:', response);
} catch (error) {
  console.error('请求失败:', error);
}
```

#### 错误处理

该方法包含完善的错误处理机制，能够识别并提供用户友好的错误消息，包括：

- 连接被拒绝：提示检查Ollama服务是否启动
- 连接超时：提示检查网络连接或服务器负载
- 模型不存在：提示下载相应模型
- 服务器内部错误：提示检查Ollama日志或重启服务

#### 与其他方法的区别

相比于`sendDirectOllamaRequest`和`pythonStyleOllamaRequest`方法，`ollamaChatCompletion`方法更加专注于聊天格式的请求，接口更简洁，使用更方便。它是辩论助手等需要进行多轮对话的功能的首选方法。

### 2023.7.20 更新：内容提取与诊断系统全面升级

在本次更新中，我们对内容提取和诊断系统进行了全面升级，显著提高了系统的稳定性和用户体验：

1. **增强的内容提取系统**：
   - 完全重构了`extractTextFromAny`方法，添加智能深度控制和路径跟踪
   - 新增循环引用检测，防止无限递归导致的崩溃
   - 优化数组处理逻辑，自动限制大型数组的处理规模
   - 智能内容合并策略，根据内容长度自动选择合适的分隔符
   - 更全面的错误处理和日志记录，便于问题排查

2. **全新的内容诊断功能**：
   - 增强的内容质量评估，检测低质量内容和潜在问题
   - 内容相似度分析，识别重复或高度相似的节点内容
   - 详细的内容统计信息，包括长度分布、类型分布等
   - 多级别问题分类（错误、警告、信息），便于用户快速识别关键问题
   - 可视化诊断报告，提供直观的内容质量评估

3. **用户体验优化**：
   - 改进的诊断报告UI，使用卡片和标签展示关键信息
   - 智能问题提示，根据问题严重性提供不同级别的反馈
   - 节点内容摘要展示，便于快速浏览和比较
   - 更清晰的错误消息，帮助用户理解和解决问题

4. **性能与稳定性提升**：
   - 优化大型嵌套结构的处理，防止性能问题
   - 增加最大递归深度限制，从5层提升到10层，同时添加更智能的深度控制
   - 改进JSON对象处理，对超大对象提供摘要而非完整序列化
   - 更健壮的边界情况处理，提高系统整体稳定性

这些改进显著提高了系统处理复杂内容结构的能力，特别是在处理大型嵌套对象、循环引用和异常数据时的稳定性。同时，新增的内容诊断功能为用户提供了更清晰的内容质量反馈，帮助用户在执行AI分析前发现并解决潜在问题。

## 多轮辩论功能

Neurite-Storm现在支持高级的多轮辩论分析功能，允许用户设置多个大语言模型进行交替对话，实现辩证式思考。

### 主要特点

1. **多模型参与**：可以设置多个不同的AI模型，每个模型代表不同的立场或角色
2. **连续对话**：支持多达15轮的连续对话，每轮由不同的参与者发表观点
3. **辩证批判**：每个模型可以针对前一轮的观点进行辩证批判，形成深入的思想交锋
4. **自动进行**：可以设置自动连续生成所有轮次的辩论内容
5. **可视化界面**：清晰展示辩论过程，包括每个参与者的立场、使用的模型和发言内容

### 使用方法

1. 在辩论助手中切换到"多轮辩论"模式
2. 添加至少两个辩论参与者，设置他们的名称、立场、使用的模型和系统提示词
3. 设置辩论轮次（默认为10轮）
4. 输入辩论主题
5. 点击"开始多轮辩论"按钮
6. 查看辩论过程并可将结果保存到图谱

这一功能特别适合需要深入探讨复杂问题、从多角度分析议题的场景，能够帮助用户获得更全面、更深入的思考。

## 多轮辩论功能使用指南

Neurite-Storm现在支持更强大的多轮辩论分析功能，可以模拟不同观点之间的辩论过程，帮助用户获得更深入、更全面的思考。

### 如何使用多轮辩论功能

1. 在图谱中选择一个或多个节点
2. 点击工具栏中的"辩论助手"按钮
3. 在辩论助手界面顶部，切换到"多轮辩论"模式
4. 在辩论参与者设置区域，配置辩论参与者：
   - 添加多个参与者，设置他们的名称、立场、使用的模型和系统提示词
   - 每个参与者代表一个不同的立场或角度
5. 设置辩论轮次（默认为10轮）
6. 确认或修改辩论主题
7. 点击"开始多轮辩论"按钮
8. 查看辩论过程，每轮由不同立场的AI模型发表观点
9. 完成后点击"保存到图谱"，将辩论结果保存为图谱节点

### 调试问题

如果辩论助手功能没有显示，请检查：

1. 确保已选择至少一个节点
2. 检查控制台是否有错误信息
3. 尝试刷新页面后重新操作
4. 如果问题仍然存在，尝试在PowerShell中使用以下命令启动开发服务器：
   ```
   cd mvp
   npm run dev
   ```

### 多轮辩论的优势

- **多角度思考**：不同立场的AI模型提供多角度的分析
- **辩证思维**：每个参与者可以针对前一轮的观点进行辩证批判
- **深入探讨**：通过多轮讨论，逐层深入探讨复杂问题
- **观点对比**：清晰展示不同立场下的论证和反驳
- **可视化界面**：直观的界面设计，使辩论过程一目了然

## 辩论风暴功能

Neurite-Storm现在提供了全新的"辩论风暴"功能，这是一种更高级的辩论分析模式，能够自动提取多个观点并让它们进行多轮交互式辩论。

### 辩论风暴的工作流程

1. **自动观点提取**：系统首先分析选定的节点内容，自动提取出5-7个不同立场的核心观点
2. **辩论代理创建**：为每个观点创建一个专门的AI辩论代理，每个代理都有特定的立场和角色
3. **多轮交互辩论**：所有代理进行多轮辩论，每轮中每个代理都会针对其他代理的观点发表评论
4. **辩论总结**：辩论结束后，系统生成一份全面的总结，包括关键观点、冲突点和最重要的收获

### 如何使用辩论风暴

1. 在图谱中选择相关节点（作为背景资料）
2. 点击工具栏中的"辩论助手"按钮
3. 在辩论助手界面顶部，切换到"辩论风暴"模式
4. 输入辩论主题
5. 点击"提取核心观点"按钮，系统会自动分析并提取观点
6. 查看提取的观点列表，设置辩论轮次（1-10轮）
7. 点击"启动辩论风暴"按钮，开始多轮辩论
8. 辩论结束后，查看生成的总结
9. 点击"保存到图谱"按钮，将完整的辩论过程和总结保存为图谱节点

### 辩论风暴的优势

- **全自动流程**：从观点提取到辩论总结，整个过程自动化
- **多角度思考**：自动识别并表达不同立场的观点
- **深度交互**：每个观点都会针对其他观点进行回应和批判
- **结构化输出**：清晰展示辩论过程和最终总结
- **Take Away Points**：自动提炼出最重要的收获和启示