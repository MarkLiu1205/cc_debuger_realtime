const path =  require('path');
const net =  require('net');
const { exec,spawn } = require('child_process');
const { pathExists, pathExistsSync, readFileSync,writeFileSync } = require('fs-extra');
const os = require('os');
const {PNG} = require('pngjs');

import packageJSON from '../../package.json';

export namespace _funcs{

export function getPluginName(){
    return packageJSON.name
}

/**
 * 获取资源信息
 * @param {string} uuiduuidOrurl
 * @returns {Promise<any>} 
 */
export async function getAssetInfoByUuid(uuidOrurl):Promise<EditorAssetInfo> {
    return Editor.Message.request('asset-db', 'query-asset-info', uuidOrurl);
}

/**
 * 获取资源 META
 * @param {string} uuidOrurl 
 * @returns {Promise<any>} 
 */
export async function getAssetMetaByUuid(uuidOrurl) {
    return Editor.Message.request('asset-db', 'query-asset-meta', uuidOrurl);
}

/**
 * 获取资源 uuid
 * @param {string} url 
 * @returns {Promise<string>} 
 */
export async function getUuidByUrl(url) {
    return Editor.Message.request('asset-db', 'query-uuid', url);
}

/**打印 */
export function log_1(...args){
    args.unshift("[plugin]")
    console.log.apply(console, args)
}

/**获取当前插件的绝对路径 */
export function getCurPluginPath(){
    return path.join(Editor.Project.path,"extensions",packageJSON.name);
}

export async function waitForSeconds(seconds:number){
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve(null)
        },seconds*1000)
    })
}

/**根据文件的路径，获取其中的所有子路径
 * 
 * 'db://assets/xxx/yyy/zzz.png' => ['db://assets', 'db://assets/xxx', 'db://assets/xxx/yyy', 'db://assets/xxx/yyy/zzz.png']
 */
export function getAllSubpathsFromUrl(resUrl:string) {
    // 移除协议部分，只保留路径部分
    const pathWithoutProtocol = resUrl.replace(/^[^:]+:\/+/, '');

    // 分割路径为数组
    const pathParts = pathWithoutProtocol.split('/');

    // 初始化结果数组
    const subpaths:Array<string> = [];

    // 遍历路径部分，构建所有可能的子路径
    let currentPath = '';
    for (let i = 0; i < pathParts.length; i++) {
        currentPath = (currentPath ? currentPath + '/' : '') + pathParts[i];
        subpaths.push(currentPath);
    }

    return subpaths;
}

/**根据资源类型获取对应的图标
 * 
 * @param {string} type 资源类型
 * @returns {string} 图标名称 会应用到 ui-icon组件 中的 value 属性
 * */
export function getIconOfResType(type:string){
    if(type==="cc.SpriteFrame"||type==="cc.Texture2D"||type==="cc.ImageAsset"){
        return "image"
    }else if(type==="cc.Prefab"){
        return "prefab"
    }else if(type==="cc.SceneAsset"){
        return "scene"
    }else if(type==="cc.Material"){
        return "material"
    }else if(type==="cc.EffectAsset"){
        return "effect"
    }else if(type==="cc.AudioClip"){
        return "audio-clip"
    }else if(type==="cc.AnimationClip"){
        return "animation-clip"
    }else if(type==="cc.JsonAsset"){
        return "json"
    }else if(type==="cc.TextAsset"){
        return "text"
    }else if(type==="cc.BitmapFont"){
        return "bitmap-font"
    }else if(type==="cc.TTFFont"){
        return "ttf-font"
    }else if(type==="cc.ParticleAsset"){
        return "particle"
    }else if(type==="cc.SpriteAtlas"){
        return "sprite-atlas"
    }else if(type==="cc.VideoClip"){
        return "video"
    }else if(type==="cc.Mesh"){
        return "mesh"
    }else if(type==="cc.Skeleton"){
        return "spine-data"
    }else if(type==="cc.AnimationClip"){
        return "animation-clip"
    }else{
        return "unknown"
    }
}

/**
 * 获取运行时的预览地址
 */
export async function getRuntimePreviewUrl(){
    const port = await new Promise((resolve)=>{
        Editor.Message.request("server","query-port").then((port)=>{
            console.log("query-port",port)
            resolve(port)
        })
    })
    
    let previewUrl = `http://localhost:${port}/`
    // let launchJsonPath = path.join(Editor.Project.path, '.vscode/launch.json')
    // if (pathExistsSync(launchJsonPath)) {
    //     try{
    //         let launchJson = JSON.parse(readFileSync(launchJsonPath, 'utf-8'))
    //         if (launchJson.configurations && launchJson.configurations[0] && launchJson.configurations[0].url) {
    //             previewUrl = launchJson.configurations[0].url
    //         }
    //     }catch(e){

    //     }
    // }
    return previewUrl
}

/**使用浏览器打开网页 */
export function openWebSiteUrl(url: string) {
    let command;
    switch (os.platform()) {
        case 'win32':
            command = `start "" "${url}"`;
            break;
        case 'darwin':
            command = `open "${url}"`;
            break;
        case 'linux':
            command = `xdg-open "${url}"`;
            break;
        default:
            console.error(`Unsupported platform: ${os.platform()}`);
            return;
    }

    // 执行命令
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行命令时出错: ${error}`);
            return;
        }
        if (stderr) {
            console.error(`标准错误输出: ${stderr}`);
        }
    });
}

/**
 * 等待一个元素真正被挂载
 * @param ref 
 * @param callback 
 * @param interval 
 * @param maxRetries 
 */
export async function waitForElementMounted(ref, interval = 100, maxRetries = 50) {
    if(ref.value){
        return ref.value
    }
    return new Promise(function (resolve,reject) {
        let retryCount = 0;
        const _id = setInterval(() => {
            if (ref.value) {
                resolve(ref.value);
                clearInterval(_id);
            } else if (retryCount >= maxRetries) {
                console.error("超时未找到目标元素");
                clearInterval(_id);
            } else {
                retryCount++;
            }
        }, interval);
    })
}

/**
 * 将值限制在指定的最小值和最大值之间。
 * 如果值超出指定区间，则返回相应边界，否则返回该值。
 * @param min - 最小值
 * @param max - 最大值
 * @param val - 要限制的值
 * @returns 限制后的值
 */
export function clamp(min: number, max: number, val: number): number {
    // 可选：添加对min和max的验证
    if (min > max) {
        throw new Error("min should be less than or equal to max");
    }
    return Math.min(Math.max(val, min), max);
}


const _childProcess:Array<any> = []
/**
 * 运行批处理命令，并返回一个 Promise，等待其执行完毕
 */
export function runCmdSpawn(cmd: string, args?: readonly string[], options?: any): Promise<void> {
    return new Promise((resolve, reject) => {
        // 使用 spawn 启动子进程
        const _process = spawn(cmd, args, {shell: true,...options});
        _childProcess.push(_process)

        // 捕获子进程输出
        _process.stdout.on('data', (data: Buffer) => {
            console.log(`[runCmdSpawn]: ${data.toString().trim()}`);
        });

        _process.stderr.on('data', (data: Buffer) => {
            console.error(`[runCmdSpawn Error]: ${data.toString().trim()}`);
        });

        _process.on('error', (error: Error) => {
            console.error('[runCmdSpawn Error]', error);
            resolve();
        });

        _process.on('exit', (code: number) => {
            _childProcess.splice(_childProcess.indexOf(_process),1)
            console.log(`[runCmdSpawn] Process exited with code ${code}`);
            if (code === 0) {
                resolve(); // 如果进程正常退出，解析 Promise
            } else {
                resolve();
            }
        });
    });
}

export function stopSpawnProcess(){
    for(let process of _childProcess){
        process.kill()
    }
    _childProcess.length = 0
}

export function rgbaToHex(r, g, b, a) {
    const toHex = (n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}

export function findAvailablePort(startPort: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

/**
 * 遍历一个对象，将其中所有的数字四舍五入到小数点后两位
 * @param obj 
 * @returns 
 */
export function roundNumbersToPrecision(obj, precision = 2) {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'number') {
            return Number(obj.toFixed(precision));
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => roundNumbersToPrecision(item, precision));
    }
    return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        if (typeof value === 'number') {
            acc[key] = Number(value.toFixed(precision));
        } else if (typeof value === 'object' && value !== null) {
            acc[key] = roundNumbersToPrecision(value, precision);
        } else {
            acc[key] = value;
        }
        return acc;
    }, {});
}

/**
 * 检查鼠标是否在元素内
 * @param element 如div
 * @param e 
 * @returns 
 */
export function checkMouseIsInElemen(element:HTMLElement,e: MouseEvent){
    const rect = element.getBoundingClientRect();
    const isContain = e.clientX > rect.x && e.clientX < (rect.x + rect.width) && e.clientY > rect.y && e.clientY < (rect.y + rect.height);
    return isContain
}

export function registerF5(){
    window.addEventListener('keyup', (event) => {
        // console.log('Global keydown event:', event.key);
        
        if(event.key=="F5"){
            console.log("按了F5")
            Editor.Message.send(_funcs.getPluginName(),"restart-self")
        }
      });
}

/**
 * 验证是否合法url
 * @param str_url 
 * @returns 
 */
export function isValidURL(str_url) {// 
    var v = new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i');
    return v.test(str_url);
}

export function base64ToUint8Array(base64String: string): Uint8Array {
    // 1. 使用 atob 将 Base64 解码为二进制字符串
    const binaryString = atob(base64String);

    // 2. 创建一个 Uint8Array 来存储结果
    const uint8Array = new Uint8Array(binaryString.length);

    // 3. 将二进制字符串的每个字符转换为 Uint8Array 中的字节
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return uint8Array;
}

export function saveUnit8ArrayPng(uint8Array:Uint8Array,width:number,height:number,savePath:string){
    const channels = 4; // RGBA 通道数

    // 创建一个新的 PNG 对象
    const png = new PNG({
        width: width,
        height: height,
        colorType: 6, // 6 表示 RGBA
        inputColorType: 6, // 输入数据是 RGBA
        inputHasAlpha: true // 输入数据包含 Alpha 通道
    });

    // 将原始像素数据复制到 PNG 对象中
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) * channels;
            const pngIdx = (width * y + x) << 2;

            png.data[pngIdx] = uint8Array[idx]; // R
            png.data[pngIdx + 1] = uint8Array[idx + 1]; // G
            png.data[pngIdx + 2] = uint8Array[idx + 2]; // B
            png.data[pngIdx + 3] = uint8Array[idx + 3]; // A
        }
    }

    // 保存为 PNG 文件
    const buffer = PNG.sync.write(png);
    writeFileSync(savePath, buffer);
    console.log('文件保存成功: ',savePath);
}

}