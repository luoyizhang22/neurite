# AI 组件测试计划

## 一、功能测试概述

本测试计划针对Neurite-Storm项目中新集成的ContentExtractor和PromptBuilder功能进行全面测试，确保它们在DebateAssistant和MultiNodeQuery组件中正常工作。

## 二、测试环境准备

1. 确保本地开发环境已正确设置
2. 启动开发服务器 (`npm run dev`)
3. 准备测试数据:
   - 创建多种类型的节点 (文本、图像、AI对话、链接等)
   - 确保节点包含充分的内容以供分析17:40:45 [vite] server restarted.
代理请求路径: /api/ollama/tags
代理请求: GET /api/tags
代理响应: 200 /api/tags (成功)
代理请求路径: /api/ollama/generate
代理请求: POST /api/generate
代理响应: 200 /api/generate (成功)
17:49:32 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx
17:49:37 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx (x2)
17:49:37 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx (x3)
17:50:14 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx (x4)
17:50:18 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx (x5)
17:50:18 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx (x6)
17:50:28 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx (x7)
17:50:34 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx (x8)
17:50:34 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx, /src/components/settings/AIModelSettings.tsx, /src/components/ai/DebateAssistant.tsx (x9)
17:53:19 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx
17:53:21 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx (x2)
17:53:22 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx (x3)
17:53:32 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx (x4)
17:53:33 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx (x5)
17:53:34 [vite] hmr update /src/components/ai/MultiNodeQuery.tsx (x6)
17:56:30 [vite] vite.config.ts changed, restarting server...
17:56:30 [vite] server restarted.
17:56:33 [vite] vite.config.ts changed, restarting server...
17:56:33 [vite] server restarted.
17:56:33 [vite] vite.config.ts changed, restarting server...
17:56:33 [vite] server restarted.
代理请求路径: /api/ollama/tags
代理请求详情: {
  "method": "GET",
  "url": "/api/tags",
  "headers": {
    "host": "localhost:3000",
    "connection": "keep-alive",
    "sec-ch-ua-platform": "\"Windows\"",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
    "accept": "application/json, text/plain, */*",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Microsoft Edge\";v=\"133\", \"Chromium\";v=\"133\"",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "referer": "http://localhost:3000/graph/1",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "cookie": "_xsrf=2|5c99a16f|727661a3a181bddb7dd6f8f5a0a7fb07|1739513782; username-localhost-8888=\"2|1:0|10:1740960627|23:username-localhost-8888|44:M2E1Y2JhYmI1MGNjNDBlNmEyMjc1ZWMyNGE4N2UxOGQ=|32eed256ab1ef333dfd1011703a3715aa28c1b454da8d7bc9357a338bd12c0aa\"; mp_851392464b60e8cc1948a193642f793b_mixpanel=%7B%22distinct_id%22%3A%20199395%2C%22%24device_id%22%3A%20%2219555c4fd2d39a-0d0c833a2b895e-4c657b58-190140-19555c4fd2d39a%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%2C%22%24user_id%22%3A%20199395%7D",
    "x-forwarded-for": "::1",
    "x-forwarded-port": "3000",
    "x-forwarded-proto": "http",
    "x-forwarded-host": "localhost:3000"
  },
  "body": "无请求体",
  "timestamp": "2025-03-04T02:00:55.919Z"
}
代理请求: GET /api/tags
代理响应: {
  status: 200,
  statusMessage: 'OK',
  url: '/api/tags',
  method: 'GET',
  headers: {
    'content-type': 'application/json; charset=utf-8',
    date: 'Tue, 04 Mar 2025 02:00:55 GMT',
    'content-length': '336',
    connection: 'close'
  },
  timestamp: '2025-03-04T02:00:55.929Z',
  isSuccess: true
}
代理请求路径: /api/ollama/generate
代理请求详情: {
  "method": "POST",
  "url": "/api/generate",
  "headers": {
    "host": "localhost:3000",
    "connection": "keep-alive",
    "content-length": "1124",
    "sec-ch-ua-platform": "\"Windows\"",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
    "accept": "application/json, text/plain, */*",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Microsoft Edge\";v=\"133\", \"Chromium\";v=\"133\"",
    "content-type": "application/json",
    "sec-ch-ua-mobile": "?0",
    "origin": "http://localhost:3000",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "referer": "http://localhost:3000/graph/1",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "cookie": "_xsrf=2|5c99a16f|727661a3a181bddb7dd6f8f5a0a7fb07|1739513782; username-localhost-8888=\"2|1:0|10:1740960627|23:username-localhost-8888|44:M2E1Y2JhYmI1MGNjNDBlNmEyMjc1ZWMyNGE4N2UxOGQ=|32eed256ab1ef333dfd1011703a3715aa28c1b454da8d7bc9357a338bd12c0aa\"; mp_851392464b60e8cc1948a193642f793b_mixpanel=%7B%22distinct_id%22%3A%20199395%2C%22%24device_id%22%3A%20%2219555c4fd2d39a-0d0c833a2b895e-4c657b58-190140-19555c4fd2d39a%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%2C%22%24user_id%22%3A%20199395%7D",
    "x-forwarded-for": "::1",
    "x-forwarded-port": "3000",
    "x-forwarded-proto": "http",
    "x-forwarded-host": "localhost:3000"
  },
  "body": "无请求体",
  "timestamp": "2025-03-04T02:00:58.938Z"
}
代理请求: POST /api/generate
代理响应: {
  status: 200,
  statusMessage: 'OK',
  url: '/api/generate',
  method: 'POST',
  headers: {
    'access-control-allow-origin': 'http://localhost:3000',
    'content-type': 'application/x-ndjson',
    vary: 'Origin',
    date: 'Tue, 04 Mar 2025 02:01:03 GMT',
    connection: 'close',
    'transfer-encoding': 'chunked'
  },
  timestamp: '2025-03-04T02:01:03.259Z',
  isSuccess: true
}

## 三、ContentExtractor测试用例

### 1. 单节点内容提取测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| CE-01  | 文本节点提取 | 1. 创建一个文本节点<br>2. 调用`ContentExtractor.extractContent(node)`<br>3. 检查返回值 | 返回包含正确文本内容、标题和类型的ExtractedContent对象 |
| CE-02  | 图像节点提取 | 1. 创建一个图像节点<br>2. 调用`ContentExtractor.extractContent(node)`<br>3. 检查返回值 | 返回包含图像描述、URL和类型的ExtractedContent对象 |
| CE-03  | AI对话节点提取 | 1. 创建一个AI对话节点<br>2. 调用`ContentExtractor.extractContent(node)`<br>3. 检查返回值 | 返回包含对话内容、提示词和AI回复的ExtractedContent对象 |
| CE-04  | 链接节点提取 | 1. 创建一个链接节点<br>2. 调用`ContentExtractor.extractContent(node)`<br>3. 检查返回值 | 返回包含链接描述、URL和标题的ExtractedContent对象 |

### 2. 多节点内容提取测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| CE-05  | 混合节点批量提取 | 1. 创建多种类型的节点<br>2. 调用`ContentExtractor.extractMultipleContents(nodes)`<br>3. 检查返回值 | 返回包含所有节点提取内容的ExtractedContent数组，每个元素对应一个节点 |
| CE-06  | 空节点处理 | 1. 创建一个没有内容的节点<br>2. 调用内容提取方法<br>3. 检查返回值 | 返回一个包含默认值的ExtractedContent对象，不抛出异常 |
| CE-07  | 大量节点处理 | 1. 创建10个以上节点<br>2. 调用批量提取方法<br>3. 检查性能和结果 | 能够在合理时间内处理并返回正确结果 |

## 四、PromptBuilder测试用例

### 1. 系统提示词构建测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| PB-01  | 比较分析提示词 | 1. 调用`PromptBuilder.buildSystemPrompt('compare', options)`<br>2. 检查返回值 | 返回适用于比较分析的系统提示词 |
| PB-02  | 综合分析提示词 | 1. 调用`PromptBuilder.buildSystemPrompt('synthesize', options)`<br>2. 检查返回值 | 返回适用于综合分析的系统提示词 |
| PB-03  | 关系探索提示词 | 1. 调用`PromptBuilder.buildSystemPrompt('relations', options)`<br>2. 检查返回值 | 返回适用于关系探索的系统提示词 |
| PB-04  | 辩论分析提示词 | 1. 调用`PromptBuilder.buildSystemPrompt('debate', options)`<br>2. 检查返回值 | 返回适用于辩论分析的系统提示词 |
| PB-05  | 自定义分析提示词 | 1. 调用`PromptBuilder.buildSystemPrompt('custom', options)`<br>2. 检查返回值 | 返回适用于自定义分析的系统提示词 |

### 2. 用户提示词构建测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| PB-06  | 构建比较分析提示词 | 1. 准备ExtractedContent数组<br>2. 调用`PromptBuilder.buildPromptByType('compare', contents, null, options)`<br>3. 检查返回值 | 返回包含所有内容并格式化为比较分析的提示词 |
| PB-07  | 构建综合分析提示词 | 1. 准备ExtractedContent数组<br>2. 调用`PromptBuilder.buildPromptByType('synthesize', contents, null, options)`<br>3. 检查返回值 | 返回包含所有内容并格式化为综合分析的提示词 |
| PB-08  | 构建带图像URL的提示词 | 1. 准备包含图像的ExtractedContent数组<br>2. 设置includeImages=true<br>3. 调用buildPromptByType方法<br>4. 检查返回值 | 返回的提示词中包含图像URL |
| PB-09  | 构建不带图像URL的提示词 | 1. 准备包含图像的ExtractedContent数组<br>2. 设置includeImages=false<br>3. 调用buildPromptByType方法<br>4. 检查返回值 | 返回的提示词中不包含图像URL |
| PB-10  | 构建自定义提示词 | 1. 准备ExtractedContent数组<br>2. 准备自定义提示词文本<br>3. 调用`PromptBuilder.buildPromptByType('custom', contents, customPrompt, options)`<br>4. 检查返回值 | 返回包含自定义提示词和所有内容的提示词 |

## 五、DebateAssistant组件测试用例

### 1. 基础功能测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| DA-01  | 初始化测试 | 1. 打开辩论助手对话框<br>2. 观察界面状态 | 界面正确加载，显示话题输入框和生成观点按钮 |
| DA-02  | 节点内容提取测试 | 1. 选择多个节点<br>2. 打开辩论助手<br>3. 观察话题自动填充 | 话题自动填充为第一个节点的标题或内容摘要 |
| DA-03  | 话题输入测试 | 1. 打开辩论助手<br>2. 修改话题<br>3. 生成观点 | 系统使用修改后的话题生成观点 |

### 2. 观点生成测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| DA-04  | 观点生成测试 | 1. 输入话题<br>2. 点击"生成观点"按钮<br>3. 观察结果 | 成功生成多个不同角度的观点，格式正确 |
| DA-05  | 观点提取功能测试 | 1. 生成观点<br>2. 检查extractPerspectivesFromText方法的效果 | 成功从AI回复中提取出格式化的观点 |
| DA-06  | 自定义观点添加测试 | 1. 输入自定义观点<br>2. 点击添加按钮<br>3. 观察观点列表 | 自定义观点成功添加到列表中 |

### 3. 辩论分析测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| DA-07  | 辩论风格选择测试 | 1. 选择不同的辩论风格(平衡式/对抗式/苏格拉底式)<br>2. 生成辩论分析<br>3. 观察结果差异 | 不同风格生成的分析具有对应的特点 |
| DA-08  | 辩论分析生成测试 | 1. 选择多个观点<br>2. 点击"生成辩论分析"按钮<br>3. 观察结果 | 成功生成包含多角度分析的辩论内容 |
| DA-09  | 最具说服力观点提取测试 | 1. 生成辩论分析<br>2. 检查最具说服力的观点是否被正确提取 | 从辩论分析中成功提取最具说服力的观点 |

### 4. 节点创建测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| DA-10  | 创建辩论节点测试 | 1. 生成辩论分析<br>2. 点击"保存到图谱"按钮<br>3. 检查图谱中的新节点 | 成功创建包含完整辩论信息的节点，包括话题、观点、分析和元数据 |
| DA-11  | 节点数据完整性测试 | 1. 创建辩论节点<br>2. 检查节点数据结构<br>3. 验证所有必要信息是否包含 | 节点数据包含话题、观点、分析结果、设置信息和源节点引用 |

## 六、MultiNodeQuery组件测试用例

### 1. 基础功能测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| MQ-01  | 初始化测试 | 1. 选择多个节点<br>2. 打开多节点查询对话框<br>3. 观察界面状态 | 界面正确加载，显示分析类型选择和节点预览 |
| MQ-02  | 节点内容提取测试 | 1. 选择多个不同类型的节点<br>2. 打开多节点查询<br>3. 检查节点预览区域 | 显示所有选中节点的预览内容，包括不同类型的节点 |
| MQ-03  | 分析类型选择测试 | 1. 打开多节点查询<br>2. 切换不同的分析类型<br>3. 观察界面变化 | 界面根据选择的分析类型更新，显示相应的选项和说明 |

### 2. 分析执行测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| MQ-04  | 比较分析执行测试 | 1. 选择多个节点<br>2. 选择"比较分析"类型<br>3. 点击"执行分析"按钮<br>4. 观察结果 | 成功生成比较分析结果，包含节点间的异同点分析 |
| MQ-05  | 综合分析执行测试 | 1. 选择多个节点<br>2. 选择"综合分析"类型<br>3. 点击"执行分析"按钮<br>4. 观察结果 | 成功生成综合分析结果，整合了所有节点的信息 |
| MQ-06  | 关系探索执行测试 | 1. 选择多个节点<br>2. 选择"关系探索"类型<br>3. 点击"执行分析"按钮<br>4. 观察结果 | 成功生成关系分析结果，识别出节点间的潜在关系 |
| MQ-07  | 自定义分析执行测试 | 1. 选择多个节点<br>2. 选择"自定义分析"类型<br>3. 输入自定义提示词<br>4. 执行分析<br>5. 观察结果 | 成功根据自定义提示词生成分析结果 |

### 3. 高级设置测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| MQ-08  | 温度参数调整测试 | 1. 打开高级设置<br>2. 调整温度参数<br>3. 执行分析<br>4. 比较不同温度下的结果 | 较高温度产生更多样化的结果，较低温度产生更确定性的结果 |
| MQ-09  | 详细程度调整测试 | 1. 打开高级设置<br>2. 选择不同的详细程度<br>3. 执行分析<br>4. 比较结果 | 不同详细程度产生不同深度的分析结果 |
| MQ-10  | 输出格式选择测试 | 1. 打开高级设置<br>2. 选择不同的输出格式<br>3. 执行分析<br>4. 检查结果格式 | 分析结果符合所选的格式要求 |

### 4. 节点创建测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| MQ-11  | 创建分析节点测试 | 1. 执行分析<br>2. 点击"创建节点"按钮<br>3. 检查图谱中的新节点 | 成功创建包含分析结果和元数据的新节点 |
| MQ-12  | 节点数据完整性测试 | 1. 创建分析节点<br>2. 检查节点数据结构<br>3. 验证所有必要信息是否包含 | 节点数据包含分析类型、结果、设置信息和源节点引用 |

## 七、集成测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| IT-01  | 完整工作流测试(辩论助手) | 1. 创建多个不同类型的节点<br>2. 选择这些节点<br>3. 打开辩论助手<br>4. 完成从生成观点到创建节点的全流程 | 整个流程顺利完成，最终创建的节点包含完整、正确的信息 |
| IT-02  | 完整工作流测试(多节点查询) | 1. 创建多个不同类型的节点<br>2. 选择这些节点<br>3. 打开多节点查询<br>4. 完成从选择分析类型到创建节点的全流程 | 整个流程顺利完成，最终创建的节点包含完整、正确的信息 |
| IT-03  | 错误处理测试 | 1. 模拟各种错误情况(网络错误、AI服务错误等)<br>2. 观察组件的错误处理和用户反馈 | 组件能够优雅地处理错误，提供清晰的错误信息给用户 |

## 八、性能测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| PT-01  | 大量节点处理性能 | 1. 选择10个以上节点<br>2. 执行分析<br>3. 测量响应时间 | 系统能在合理时间内(30秒内)完成处理，不出现崩溃或内存泄漏 |
| PT-02  | 长文本节点处理 | 1. 创建包含大量文本(5000字以上)的节点<br>2. 使用这些节点执行分析<br>3. 观察性能和结果 | 系统能够有效处理大型文本，提取合适的内容进行分析 |
| PT-03  | 连续操作稳定性 | 1. 连续执行多次(10次以上)分析操作<br>2. 观察系统稳定性和性能变化 | 系统保持稳定，不出现性能下降或内存泄漏 |

## 九、用户体验测试

| 测试ID | 描述 | 步骤 | 预期结果 |
|--------|------|------|----------|
| UX-01  | 界面响应性测试 | 1. 操作各种界面元素<br>2. 观察响应速度和反馈 | 界面元素响应迅速，提供适当的视觉反馈 |
| UX-02  | 导航流畅性测试 | 1. 在不同步骤间导航<br>2. 使用返回按钮<br>3. 观察状态保持 | 导航流畅，状态正确保持，用户不会丢失操作进度 |
| UX-03  | 错误提示清晰度测试 | 1. 触发各种错误情况<br>2. 评估错误提示的清晰度和帮助性 | 错误提示清晰明了，提供解决问题的建议 |

## 十、结论与建议

测试完成后，请总结以下内容：

1. 功能完整性评估
2. 发现的问题和缺陷列表
3. 改进建议
4. 后续测试建议 