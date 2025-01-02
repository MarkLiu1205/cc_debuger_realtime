"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._misc = void 0;
const path = __importStar(require("path"));
const { exec } = require('child_process');
const package_json_1 = __importDefault(require("../../package.json"));
const fs_extra_1 = require("fs-extra");
const child_process_1 = require("child_process");
var _misc;
(function (_misc) {
    /**打印 */
    function log_1(...args) {
        args.unshift("[plugin]");
        console.log.apply(console, args);
    }
    _misc.log_1 = log_1;
    /**获取当前插件的绝对路径 */
    function getCurPluginPath() {
        return path.join(Editor.Project.path, "extensions", package_json_1.default.name);
    }
    _misc.getCurPluginPath = getCurPluginPath;
    async function waitForSeconds(seconds) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(null);
            }, seconds * 1000);
        });
    }
    _misc.waitForSeconds = waitForSeconds;
    /**根据文件的路径，获取其中的所有子路径
     *
     * 'db://assets/xxx/yyy/zzz.png' => ['db://assets', 'db://assets/xxx', 'db://assets/xxx/yyy', 'db://assets/xxx/yyy/zzz.png']
     */
    function getAllSubpathsFromUrl(resUrl) {
        // 移除协议部分，只保留路径部分
        const pathWithoutProtocol = resUrl.replace(/^[^:]+:\/\//, '');
        // 分割路径为数组
        const pathParts = pathWithoutProtocol.split('/');
        // 初始化结果数组
        const subpaths = [];
        // 遍历路径部分，构建所有可能的子路径
        let currentPath = '';
        for (let i = 0; i < pathParts.length; i++) {
            currentPath = (currentPath ? currentPath + '/' : '') + pathParts[i];
            subpaths.push(currentPath);
        }
        return subpaths;
    }
    _misc.getAllSubpathsFromUrl = getAllSubpathsFromUrl;
    /**根据资源类型获取对应的图标
     *
     * @param {string} type 资源类型
     * @returns {string} 图标名称 会应用到 ui-icon组件 中的 value 属性
     * */
    function getIconOfResType(type) {
        if (type === "cc.SpriteFrame" || type === "cc.Texture2D" || type === "cc.ImageAsset") {
            return "image";
        }
        else if (type === "cc.Prefab") {
            return "prefab";
        }
        else if (type === "cc.SceneAsset") {
            return "scene";
        }
        else if (type === "cc.Material") {
            return "material";
        }
        else if (type === "cc.EffectAsset") {
            return "effect";
        }
        else if (type === "cc.AudioClip") {
            return "audio-clip";
        }
        else if (type === "cc.AnimationClip") {
            return "animation-clip";
        }
        else if (type === "cc.JsonAsset") {
            return "json";
        }
        else if (type === "cc.TextAsset") {
            return "text";
        }
        else if (type === "cc.BitmapFont") {
            return "bitmap-font";
        }
        else if (type === "cc.TTFFont") {
            return "ttf-font";
        }
        else if (type === "cc.ParticleAsset") {
            return "particle";
        }
        else if (type === "cc.SpriteAtlas") {
            return "sprite-atlas";
        }
        else if (type === "cc.VideoClip") {
            return "video";
        }
        else if (type === "cc.Mesh") {
            return "mesh";
        }
        else if (type === "cc.Skeleton") {
            return "spine-data";
        }
        else if (type === "cc.AnimationClip") {
            return "animation-clip";
        }
        else {
            return "unknown";
        }
    }
    _misc.getIconOfResType = getIconOfResType;
    /**
     * 获取运行时的预览地址
     */
    function getRuntimePreviewUrl() {
        let port = 7456;
        let previewUrl = `http://localhost:${port}/`;
        let launchJsonPath = path.join(Editor.Project.path, '.vscode/launch.json');
        if ((0, fs_extra_1.pathExistsSync)(launchJsonPath)) {
            try {
                let launchJson = JSON.parse((0, fs_extra_1.readFileSync)(launchJsonPath, 'utf-8'));
                if (launchJson.configurations && launchJson.configurations[0] && launchJson.configurations[0].url) {
                    previewUrl = launchJson.configurations[0].url;
                }
            }
            catch (e) {
            }
        }
        return previewUrl;
    }
    _misc.getRuntimePreviewUrl = getRuntimePreviewUrl;
    /**使用浏览器打开网页 */
    function openWebSiteUrl(url) {
        const command = `start "" "${url}"`;
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
    _misc.openWebSiteUrl = openWebSiteUrl;
    /**
     * 等待一个元素真正被挂载
     * @param ref
     * @param callback
     * @param interval
     * @param maxRetries
     */
    async function waitForElementMounted(ref, interval = 100, maxRetries = 50) {
        if (ref.value) {
            return ref.value;
        }
        return new Promise(function (resolve, reject) {
            let retryCount = 0;
            const _id = setInterval(() => {
                if (ref.value) {
                    resolve(ref.value);
                    clearInterval(_id);
                }
                else if (retryCount >= maxRetries) {
                    console.error("超时未找到目标元素");
                    clearInterval(_id);
                }
                else {
                    retryCount++;
                }
            }, interval);
        });
    }
    _misc.waitForElementMounted = waitForElementMounted;
    /**
     * 将值限制在指定的最小值和最大值之间。
     * 如果值超出指定区间，则返回相应边界，否则返回该值。
     * @param min - 最小值
     * @param max - 最大值
     * @param val - 要限制的值
     * @returns 限制后的值
     */
    function clamp(min, max, val) {
        // 可选：添加对min和max的验证
        if (min > max) {
            throw new Error("min should be less than or equal to max");
        }
        return Math.min(Math.max(val, min), max);
    }
    _misc.clamp = clamp;
    const _childProcess = [];
    /**
     * 运行批处理命令，并返回一个 Promise，等待其执行完毕
     */
    function runCmdSpawn(cmd, args, options) {
        return new Promise((resolve, reject) => {
            // 使用 spawn 启动子进程
            const _process = (0, child_process_1.spawn)(cmd, args, Object.assign({ shell: true }, options));
            _childProcess.push(_process);
            // 捕获子进程输出
            _process.stdout.on('data', (data) => {
                console.log(`[runCmdSpawn]: ${data.toString().trim()}`);
            });
            _process.stderr.on('data', (data) => {
                console.error(`[runCmdSpawn Error]: ${data.toString().trim()}`);
            });
            _process.on('error', (error) => {
                console.error('[runCmdSpawn Error]', error);
                resolve();
            });
            _process.on('exit', (code) => {
                _childProcess.splice(_childProcess.indexOf(_process), 1);
                console.log(`[runCmdSpawn] Process exited with code ${code}`);
                if (code === 0) {
                    resolve(); // 如果进程正常退出，解析 Promise
                }
                else {
                    resolve();
                }
            });
        });
    }
    _misc.runCmdSpawn = runCmdSpawn;
    function stopSpawnProcess() {
        for (let process of _childProcess) {
            process.kill();
        }
        _childProcess.length = 0;
    }
    _misc.stopSpawnProcess = stopSpawnProcess;
})(_misc = exports._misc || (exports._misc = {}));
