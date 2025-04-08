const path =  require('path');
const net =  require('net');
const { exec,spawn } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
// const {PNG} = require('pngjs');
const http = require('http');
const crypto = require('crypto');
const url = require('url');

import { MessageParams } from 'element-plus';
import packageJSON from '../../package.json';
import { inject } from 'vue';

export namespace _funcs{

export function getPluginName(){
    return packageJSON.name
}

export function getPluginVersionName(){
    const verTxt = getCurPluginPath()+"/version.txt"
    let versionStr = fs.readFileSync(verTxt)
    if(versionStr.toString){
        versionStr = versionStr.toString()
    }
    
    if(typeof versionStr=="string"){
        versionStr = versionStr.trim()
        const versionRegex = /^\d+(\.\d+)*$/;
        if(!versionRegex.test(versionStr)){
            versionStr = packageJSON.version
        }
    }else{
        versionStr = packageJSON.version
    }
    
    return versionStr
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
    }else if(type==="sp.SkeletonData"){
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
            // console.log("query-port",port)
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
                // console.error("超时未找到目标元素");
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
            // console.log("按了F5")
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

// export function base64ToUint8Array(base64String: string): Uint8Array {
//     // 1. 使用 atob 将 Base64 解码为二进制字符串
//     const binaryString = atob(base64String);

//     // 2. 创建一个 Uint8Array 来存储结果
//     const uint8Array = new Uint8Array(binaryString.length);

//     // 3. 将二进制字符串的每个字符转换为 Uint8Array 中的字节
//     for (let i = 0; i < binaryString.length; i++) {
//         uint8Array[i] = binaryString.charCodeAt(i);
//     }

//     return uint8Array;
// }

// export function saveUnit8ArrayPng(uint8Array:Uint8Array,width:number,height:number,savePath:string){
//     const channels = 4; // RGBA 通道数

//     // 创建一个新的 PNG 对象
//     const png = new PNG({
//         width: width,
//         height: height,
//         colorType: 6, // 6 表示 RGBA
//         inputColorType: 6, // 输入数据是 RGBA
//         inputHasAlpha: true // 输入数据包含 Alpha 通道
//     });

//     // 将原始像素数据复制到 PNG 对象中
//     for (let y = 0; y < height; y++) {
//         for (let x = 0; x < width; x++) {
//             const idx = (width * y + x) * channels;
//             const pngIdx = (width * y + x) << 2;

//             png.data[pngIdx] = uint8Array[idx]; // R
//             png.data[pngIdx + 1] = uint8Array[idx + 1]; // G
//             png.data[pngIdx + 2] = uint8Array[idx + 2]; // B
//             png.data[pngIdx + 3] = uint8Array[idx + 3]; // A
//         }
//     }

//     // 保存为 PNG 文件
//     const buffer = PNG.sync.write(png);
//     fs.writeFileSync(savePath, buffer);
//     console.log('文件保存成功: ',savePath);
// }

export async function ensureFloderExist(dirPath:string){
    try {
        await fs.ensureDir(dirPath);
        // console.log('文件夹已存在或已创建!');
        return dirPath;
    } catch (err) {
        console.error(`操作文件夹时出错: ${err.message}`);
        return null;
    }
}

// 获取本地 IP
export function getLocalIpv4IP():string {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const interfaceDetails = interfaces[interfaceName];
        for (const detail of interfaceDetails) {
            if (detail.family === 'IPv4' && !detail.internal) {
                return detail.address;
            }
        }
    }
    return '未找到 IP 地址';
}

export function getLocalIPs() {
    const nets = os.networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
            if (net.family === 'IPv6' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    return results;
}

/**判断IP是否是本机 */
export function checkIpIsLocalhost(ip:string){
    const localIps = _funcs.getLocalIPs();
    if(ip=="localhost"||ip=="::1"||ip=="127.0.0.1"||localIps.includes(ip)){
        return true
    }else{
        return false
    }
}

export function getFs(){
    return fs
}

export async function getLocalServerJsonPath(){
    const floderPath = `${getCurPluginPath()}/cache`;
    const jsonCfgPath = `${floderPath}/localServer.json`
    await ensureFloderExist(floderPath);
    return jsonCfgPath
}

//保存自定义中转服务器地址，下次自动连接这个地址的服务器，而非本机
export async function saveCustomServerAddress(url:string) {
    const jsonCfgPath = await getLocalServerJsonPath()
    let obj = null
    try{
        obj = fs.readJSONSync(jsonCfgPath)
    }catch(e){
        
    }
    obj = {
        ip:obj?.ip,
        port:obj?.port,
        ws:url
    }
    if(!obj.ip){
        delete obj.ip
    }
    if(!obj.port){
        delete obj.port
    }

    fs.writeFileSync(jsonCfgPath,JSON.stringify(obj,null,4))
}

let __hh_time = 0
export function printTime(tag:string,...args){
    let now = Date.now()
    if(__hh_time==0){
        __hh_time = now
    }else{
        console.log(tag,now - __hh_time,...args)
        __hh_time = now
    }
}

export function getI18nText(key:string){
    key = `${getPluginName()}.${key}`
    let str = Editor.I18n.t(key);
    if(str==""){
        _funcs.log_1(`i18n.${key}为空`)
    }
    return str
}

/**
 * 格式化字符串 formatStr("参数1:{0}, 参数2:{1}","aaa",123)
 * @param format 
 * @param args 
 * @returns 
 */
export function formatStr(format:string,...args){
    return format.replace(/\{(\d+)\}/g, function(match, index) {
        return typeof args[index] !== 'undefined' ? args[index] : match;
    });
}

/** 
     * @param stramp:毫秒级
     * 对Date的扩展，将 Date 转化为指定格式的String   
    * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
    * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
    * 例子：   
    * (formatDate("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
    * (formatDate("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
    */
export function formatDate(fmt:string,stramp?:number): string{
    let date = new Date();
    if(stramp!=null){
        date.setTime(stramp);
    }
    
    var o = {
        "M+": date.getMonth() + 1,                 //月份   
        "d+": date.getDate(),                    //日   
        "h+": date.getHours(),                   //小时   
        "m+": date.getMinutes(),                 //分   
        "s+": date.getSeconds(),                 //秒   
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度   
        "S": date.getMilliseconds()             //毫秒   
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;   
}

export async function openEvalPanel(param=""){
    const panelId = _funcs.getPluginName()+".eval_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }

    if(param){
        Editor.Message.request(_funcs.getPluginName(),"setDefaultEvalStr",param)
    }
}

// function generateKey() {
//     let key = '';
//     for (let i = 0; i < 32; i++) {
//         key += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16));
//     }

//     let segments = [];
//     for (let i = 0; i < 4; i++) {
//         let val:any = key.slice(i * 8, (i + 1) * 8);
//         val = parseInt(val, 16).toString();
//         let newStr = '';
//         for (let j = 0; j < val.length; j++) {
//             newStr += (9 - parseInt(val.charAt(j))).toString();
//         }
//         val = parseInt(newStr);
//         segments.push(val);
//     }

//     return segments;
// }

export function parseKey(segments) {
    let key = '';
    for (let i = 0; i < segments.length; i++) {
        let val = segments[i].toString();
        let newStr = '';
        for (let j = 0; j < val.length; j++) {
            newStr += (9 - parseInt(val.charAt(j))).toString();
        }
        key += parseInt(newStr).toString(16).padStart(8, '0');
    }
    return key;
}

// XOR 加密和解密的通用异或函数
function xor(inputBytes:Uint8Array, keyBytes:Uint8Array) {
    const output = new Uint8Array(inputBytes.length);
    for (let i = 0; i < inputBytes.length; i++) {
        output[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return output;
}

// 加密函数
export function str_encrypt(input: string, key: string) {
    if (key == null) {
        console.log("key 不能为空");
        return;
    }
    // 将输入和密钥转换为字节数组
    const inputBytes = new TextEncoder().encode(input);
    const keyBytes = new TextEncoder().encode(key);

    // 调用 xor 进行异或加密
    const xorResult = xor(inputBytes, keyBytes);

    // 将字节数组分块转换为 Base64 编码字符串
    const chunkSize = 0x8000; // 每次处理 32768 个字节
    let result = '';
    for (let i = 0; i < xorResult.length; i += chunkSize) {
        const chunk = xorResult.subarray(i, i + chunkSize);
        result += String.fromCharCode.apply(null, Array.from(chunk));
    }

    return btoa(result);
}

// 解密函数
export function str_decrypt(base64Input: string, key: string) {
    if (key == null) {
        console.log("key 不能为空");
        return;
    }
    // Base64 解码为字节数组
    const binaryString = atob(base64Input);
    const chunkSize = 0x8000; // 每次处理 32768 个字节
    const xorResult = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += chunkSize) {
        const chunk = binaryString.slice(i, i + chunkSize);
        for (let j = 0; j < chunk.length; j++) {
            xorResult[i + j] = chunk.charCodeAt(j);
        }
    }

    // 将密钥转换为字节数组
    const keyBytes = new TextEncoder().encode(key);

    // 调用 xor 进行异或解密
    const originalBytes = xor(xorResult, keyBytes);

    // 将解密后的字节数组转换为字符串
    return new TextDecoder().decode(originalBytes);
}

/**压缩字符串 */
export function pako_deflate(str:string){
    return pako.deflate(str, { to: 'string' });
}

/**解压字符串 */
export function pako_inflate(str:string){
    return pako.inflate(str, { to: 'string' });
}

let _designSize = null
export async function getStaticsInfo(){
    const pPath = Editor.Project.path
    console.log("pPath",pPath)
    console.log("Editor.Project.tmpDir",Editor.Project.tmpDir)
    const projPath = path.join(Editor.Project.path,"settings/v2/packages/project.json") 

    const projJson = fs.readJSONSync(projPath)
    console.log("projJson",projJson)
        
    if(this._designSize==null){
        const cmd = `const {width,height} = cc.view.getDesignResolutionSize();return {width,height}`
        const size = await this.evalJsInRuntime(cmd)
        console.log("执行",size)
    }
}

export function getDesignResolutionSize():{width:number,height:number}{
    const projPath = path.join(Editor.Project.path,"settings/v2/packages/project.json") 
    if(fs.existsSync(projPath)){
        try{
            const projJson = fs.readJSONSync(projPath)
            if(projJson?.general?.designResolution){
                // console.log("projJson?.general?.designResolution",JSON.stringify(projJson?.general?.designResolution))
                return projJson?.general?.designResolution
            }
        }catch(e){

        }
    }
    return null
}

export function getMethodOfUrl(httpLink:string){
    // 使用 url.parse 解析 URL
    const parsedUrl = url.parse(httpLink);

    // 获取路径部分
    const method = parsedUrl.pathname;

    return method
}

export function str_to_md5(input:string) {
    // 创建一个MD5哈希对象
    const hash = crypto.createHash('md5');
    
    // 更新哈希对象的内容为输入字符串
    hash.update(input);
    
    // 计算MD5哈希值，并返回十六进制格式的字符串
    return hash.digest('hex');
}

const CHECK_CDOE = "7FC7F4BE5C4E543E0F3439095EE00A95"
/**计算http方法签名 */
export function make_sign_of_method(method:string, postData: Record<string,any>,signCode=null) : string{
    signCode = signCode || CHECK_CDOE;
    let paramStr = "";
    let kArr = [];
    for(let k in postData){
        kArr.push(k);
    }
    kArr.sort((a,b)=>{
        return a>b?1:-1;
    });
    for(let k of kArr){
        let v = postData[k];
        
        if(paramStr.length != 0){
            paramStr += '&';
        }
        if(typeof v=="object"){
            v = JSON.stringify(v)
        }
        paramStr += k + '=' + v;
    }

    let orignStr = method + ';' + paramStr + ';' + signCode;
    let md5Str = str_to_md5(orignStr);
    console.log("-------签名字符串:\n",orignStr,"\nsign:",md5Str);
    return md5Str;
}

/**​
 * 发送 POST 请求的 async 函数
 * @param {string} url - 请求的 URL
 * @param {Object} data - 要发送的数据对象
 * @returns {Promise<Object>} - 返回解析后的响应数据
 */
export async function sendPostRequest(url:string, data:Record<string,any>,withSign=false):Promise<any> {
    return new Promise((resolve, reject) => {
        if(withSign){
            const method = getMethodOfUrl(url)
            
            const signStr = make_sign_of_method(method,data)
            data["sign"] = signStr

            // console.log("------url",url)
            // console.log("------method",method)
            // console.log("data",data)
        }
        // 将数据对象转换为 JSON 字符串
        const postData = JSON.stringify(data);

        // 配置请求选项
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        // 创建请求对象
        const req = http.request(url, options, (res) => {
            let responseBody = '';

            // 接收响应数据
            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            // 响应结束
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        // 尝试解析 JSON 响应
                        resolve(JSON.parse(responseBody));
                    } catch (error) {
                        resolve(responseBody); // 如果不是 JSON，直接返回原始响应
                    }
                } else {
                    reject(new Error(`Request failed with status code ${res.statusCode}`));
                }
            });
        });

        // 处理请求错误
        req.on('error', (error) => {
            reject(error);
        });

        // 发送请求体
        req.write(postData);
        req.end();
    });
}

}

declare var pako: any;

function _initPako(){
    if(globalThis.pako!=null){
        return
    }
    let pakoPath = path.join(_funcs.getCurPluginPath(), "src/tools/", "pako.min.js");
    let pakoStr = fs.readFileSync(pakoPath,"utf-8")
    
    try{
        const _func = new Function(pakoStr)
        _func()
    
    
    }catch(e){
        console.log(e)
    }
}

_initPako()