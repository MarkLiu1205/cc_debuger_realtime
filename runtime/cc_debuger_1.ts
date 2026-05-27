import * as cc from "cc"
import * as ccenv from 'cc/env'
import { game } from 'cc';
import { Game } from 'cc';

window["__cchyz"] = cc
window["__ccenvhyz"] = ccenv

interface FileDownloadConfig {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

interface FileDownloadResult {
  text: string;
  url: string;
  fileName: string;
}

const downloadJsFile = async ({
  url,
  method = 'GET',
  headers = {},
  withCredentials = false
}: FileDownloadConfig): Promise<FileDownloadResult> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // 关键配置：接收文本数据
    xhr.open(method, url, true);
    xhr.responseType = 'text'; // 修改为文本接收
    xhr.withCredentials = withCredentials;

    // 设置请求头
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // 处理响应
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          // 直接获取文本内容
          const textContent = xhr.response;
          
          // 提取文件名（优先从响应头获取）
          const contentDisposition = xhr.getResponseHeader('Content-Disposition');
          let fileName = 'downloaded.js';
          
          if (contentDisposition?.includes('filename=')) {
            fileName = decodeURIComponent(
              contentDisposition
                .split('filename=')[1]
                .split(';')[0]
                .replace(/['"]/g, '')
            );
          } else {
            fileName = url.split('/').pop() || 'downloaded.js';
          }

          resolve({ text: textContent, url, fileName });
        } catch (error) {
          reject(new Error(`文本解析失败: ${error}`));
        }
      } else {
        reject(new Error(`请求失败，状态码: ${xhr.status}`));
      }
    };

    // 错误处理
    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.ontimeout = () => reject(new Error('请求超时'));
    
    // 发送请求
    xhr.send();
  });
};

function isWebSocketSupported() {
    const wsCls = window["WebSocket"]
    if (typeof wsCls === 'function') {
        return true;
    }
    return false;
}

async function load_cc_debuger_runtime(){
    // 某些 release build 不含 cc.profiler，cc_debuger_2 调用 profiler.isShowingStats() 会抛错，
    // 进而中断 loopWithInterval 里的节点树同步。这里在加载运行时前补一个安全 stub。
    try {
        const _ccObj = globalThis["__cchyz"]
        if(_ccObj && !_ccObj.profiler){
            _ccObj.profiler = {
                isShowingStats: function(){ return false },
                showStats: function(){},
                hideStats: function(){},
                _stats: null,
            }
        }
    } catch(e) {}
    let _initOnce = window["__cc_debuger__initOnce"]
    if(_initOnce){
        return Promise.resolve(_initOnce)
    }
    // 优先使用打包时内嵌的本地运行时，避免依赖远程 ccdebuger.com。
    // 注入时(runtime_socket_helper.load_ts_to_runtime)会把 cc_debuger_2_ugly.ts 与 pako 的内容
    // 替换进下方 LOCAL_CC_DEBUGER_2_JS / LOCAL_PAKO_JS 两个常量。
    // 若未被替换(仍是短占位串，length 很小)或执行失败，则回退到远程下载，保证零回归。
    try {
        const _hasLocalRuntime = LOCAL_CC_DEBUGER_2_JS && LOCAL_CC_DEBUGER_2_JS.length > 1000
        if(_hasLocalRuntime){
            const _hasLocalPako = LOCAL_PAKO_JS && LOCAL_PAKO_JS.length > 1000
            if(_hasLocalPako){
                const _pakoScript = document.createElement('script')
                _pakoScript.textContent = LOCAL_PAKO_JS
                document.head.appendChild(_pakoScript)
            }
            new Function(LOCAL_CC_DEBUGER_2_JS)()
            const _initOnceLocal = window["__cc_debuger__initOnce"]
            if(_initOnceLocal){
                return Promise.resolve(_initOnceLocal)
            }
        }
    } catch(e) {
        console.warn("cc_debuger: 本地内嵌运行时执行失败，回退远程加载", e)
    }
    //如果本地没有内嵌运行时(或执行失败)，尝试去加载远程代码
    const jsUrl_1 = `http://ccdebuger.com:9001/ccdebuger.runtime/ccdebuger.pako.min.js?t=${Date.now()}`
    const jsUrl_2 = `http://ccdebuger.com:9001/ccdebuger.runtime/cc_debuger_2_ugly.ts?t=${Date.now()}`
    const text_1 = await downloadJsFile({url:jsUrl_1})
    const text_2 = await downloadJsFile({url:jsUrl_2})
    if(text_1 && text_2){
        // 先执行 pako(UMD 会挂上 window.pako），cc_debuger_2 的 encrypted:2 压缩消息依赖它。
        // 之前漏了执行 pako，导致 runtime 端 pako 未定义、节点树等压缩消息无法收发。
        const _pakoScript = document.createElement('script')
        _pakoScript.textContent = text_1.text
        document.head.appendChild(_pakoScript)
        new Function(text_2.text)()
        let _initOnce = window["__cc_debuger__initOnce"]
        return Promise.resolve(_initOnce)
    }
    return null
}

game.on(Game.EVENT_GAME_INITED,()=>{
    if(!isWebSocketSupported()){
        console.warn("cc_debugger_realtime requires websocket, but websocket is not enabled")
        return
    }
    
    //是否启动app后自动连接服务器
    let bAutoStart = true;
    //中转服务器地址
    let plugin_server_address = `ws://localhost:8085`;
    globalThis['__cc_debuger_wsUrl'] = plugin_server_address
    if (!ccenv.EDITOR && bAutoStart) {
        load_cc_debuger_runtime().then((_initOnce)=>{
            _initOnce&&_initOnce(plugin_server_address)
        })
    }
});

// 以下两个常量为「本地内嵌运行时」的占位符，默认是短占位串。
// 插件注入时会用正则把整行替换成内嵌的真实内容(cc_debuger_2_ugly.ts / pako)。
// 放在文件最底部，避免影响 applyBuildParamBefore 对 bAutoStart / plugin_server_address 的正则替换。
const LOCAL_CC_DEBUGER_2_JS = "__CC_DEBUGER_2_NOT_INLINED__";
const LOCAL_PAKO_JS = "__CC_DEBUGER_PAKO_NOT_INLINED__";


