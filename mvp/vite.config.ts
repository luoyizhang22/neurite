import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@api': path.resolve(__dirname, './src/api'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@styles': path.resolve(__dirname, './src/styles')
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: {
      origin: '*', // 允许所有域的跨域请求
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    // 禁用流响应压缩
    middlewareMode: false,
    // 配置在启动时自动尝试连接Ollama
    onBeforeMiddleware: (app) => {
      const http = require('http');
      
      console.log('正在检查Ollama服务可用性...');
      
      const checkOllamaService = () => {
        const req = http.request({
          hostname: 'localhost',
          port: 11434,
          path: '/api/tags',
          method: 'GET',
          timeout: 2000
        }, (res) => {
          if (res.statusCode === 200) {
            console.log('✅ Ollama服务已就绪，可以使用');
          } else {
            console.log(`⚠️ Ollama服务返回状态码：${res.statusCode}`);
          }
        });
        
        req.on('error', (error) => {
          console.log(`❌ Ollama服务检查失败: ${error.message}`);
          console.log('提示: 请确保Ollama服务已启动 (命令: ollama serve)');
        });
        
        req.on('timeout', () => {
          req.destroy();
          console.log('❌ Ollama服务检查超时');
        });
        
        req.end();
      };
      
      // 启动时检查
      checkOllamaService();
      
      // 每分钟检查一次
      setInterval(checkOllamaService, 60000);
    },
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        secure: false,
        ws: true, // 支持WebSocket
        rewrite: (path) => {
          console.log('代理请求路径:', path);
          // 根据不同路径进行不同的重写
          if (path.endsWith('/generate')) {
            return '/api/generate';
          } else if (path.endsWith('/chat')) {
            return '/api/chat';
          } else if (path.includes('/tags')) {
            return '/api/tags';
          } else {
            // 默认重写为标准api路径
            return path.replace(/^\/api\/ollama/, '/api');
          }
        },
        configure: (proxy, _options) => {
          // 处理流式响应的特殊配置
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 记录详细的请求信息
            const requestDetails = {
              method: req.method,
              url: req.url,
              headers: req.headers,
              body: req.body ? '有请求体' : '无请求体',
              timestamp: new Date().toISOString()
            };
            console.log('代理请求详情:', JSON.stringify(requestDetails, null, 2));
            
            // 检查是否要禁用流式响应
            if (req.url?.includes('/generate') || req.url?.includes('/chat')) {
              // 读取并可能修改请求体
              if (req.body) {
                let body = req.body;
                // 确保请求体中stream设置为false
                if (typeof body === 'object' && body !== null) {
                  if (body.stream === undefined || body.stream === true) {
                    body.stream = false;
                    
                    // 重新设置Content-Length
                    const bodyData = JSON.stringify(body);
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    
                    // 重写请求体
                    proxyReq.write(bodyData);
                    
                    console.log('已修改请求体，禁用流式响应模式');
                  }
                }
              }
              
              // 增加请求体日志
              let bodyPreview = '';
              if (req.body) {
                bodyPreview = JSON.stringify(req.body).substring(0, 200) + '...';
              }
              console.log('代理请求:', req.method, req.url, bodyPreview ? `请求体预览: ${bodyPreview}` : '');
            } else {
              // 增加请求体日志
              let bodyPreview = '';
              if (req.body) {
                bodyPreview = JSON.stringify(req.body).substring(0, 200) + '...';
              }
              console.log('代理请求:', req.method, req.url, bodyPreview ? `请求体预览: ${bodyPreview}` : '');
            }
          });
          
          // 增强错误处理
          proxy.on('error', (err, req, res) => {
            console.error('代理错误:', {
              error: err.message,
              code: err.code,
              stack: err.stack,
              url: req.url,
              method: req.method
            });
            
            // 帮助诊断问题
            let diagnosisInfo = '';
            if (err.code === 'ECONNREFUSED') {
              diagnosisInfo = 'Ollama服务可能未运行，请使用"ollama serve"命令启动服务';
            } else if (err.code === 'ETIMEDOUT') {
              diagnosisInfo = '连接超时，请检查Ollama服务器状态和网络连接';
            } else if (err.message.includes('socket hang up')) {
              diagnosisInfo = '连接被意外关闭，可能是网络波动或服务器问题';
            } else if (err.message.includes('network')) {
              diagnosisInfo = '网络错误，请检查您的网络连接和防火墙设置';
            }
            
            console.log('诊断建议:', diagnosisInfo || '未知错误，请查看服务器日志');
            
            // 如果响应未完成，发送错误响应
            if (!res.headersSent && res.writeHead) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              const errorResponse = {
                error: true,
                message: `代理错误: ${err.message}`,
                code: err.code,
                diagnosis: diagnosisInfo,
                time: new Date().toISOString()
              };
              res.end(JSON.stringify(errorResponse));
            }
          });
          
          // 响应处理增强
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 记录详细的响应信息
            console.log('代理响应:', {
              status: proxyRes.statusCode,
              statusMessage: proxyRes.statusMessage,
              url: req.url,
              method: req.method,
              headers: proxyRes.headers,
              timestamp: new Date().toISOString(),
              isSuccess: proxyRes.statusCode >= 200 && proxyRes.statusCode < 300
            });
              
            // 对流式响应进行特殊处理
            if (req.url?.includes('/generate') || req.url?.includes('/chat')) {
              const contentType = proxyRes.headers['content-type'] || '';
              if (contentType.includes('application/json')) {
                console.log('JSON响应类型:', contentType);
                
                // 收集完整的响应数据
                let responseData = '';
                
                proxyRes.on('data', (chunk) => {
                  responseData += chunk.toString();
                });
                
                proxyRes.on('end', () => {
                  // 只记录响应的前200个字符，避免日志过大
                  if (responseData.length > 0) {
                    console.log('响应数据预览:', responseData.substring(0, 200) + '...');
                  }
                });
              } else if (contentType.includes('text/event-stream')) {
                console.log('检测到流式响应，正在处理...');
                
                // 收集流式响应片段
                let streamChunks: string[] = [];
                
                proxyRes.on('data', (chunk) => {
                  const chunkStr = chunk.toString();
                  streamChunks.push(chunkStr);
                  
                  // 只记录前几个片段，避免日志过大
                  if (streamChunks.length <= 3) {
                    console.log(`流式响应片段 #${streamChunks.length}:`, chunkStr.substring(0, 100) + '...');
                  }
                });
                
                proxyRes.on('end', () => {
                  console.log(`流式响应结束，共收到 ${streamChunks.length} 个片段`);
                });
              }
            }
          });
        },
        // 增加代理超时设置
        timeout: 180000, // 3分钟超时，适应大型生成任务
        // 禁用bodyParser，以支持流式请求
        selfHandleResponse: false,
        // 添加额外的重试和健壮性设置
        agent: false, // 禁用代理agent以避免潜在问题
        secure: false, // 忽略SSL错误
        proxyTimeout: 180000, // 代理超时设置
        followRedirects: true, // 跟随重定向
        autoRewrite: true, // 自动重写头部
        xfwd: true // 转发X-Forwarded头部
      }
    }
  }
}); 