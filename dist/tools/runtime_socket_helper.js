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
exports.unload_ts_from_runtime = exports.load_ts_to_runtime = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// @ts-ignore
const package_json_1 = __importDefault(require("../../package.json"));
const _funcs_1 = require("./_funcs");
const runtimeScriptName = 'runtime_socket.ts';
const runtimeScriptPath = path.join(Editor.Project.path, 'assets', runtimeScriptName);
const runtimeMetaPath = runtimeScriptPath + '.meta';
const load_ts_to_runtime = async () => {
    try {
        console.log(`[${package_json_1.default.name}] Injecting runtime script...`);
        const sourceScriptPath = path.join(_funcs_1._funcs.getCurPluginPath(), "src/tools/", runtimeScriptName);
        const sourceScriptContent = fs.readFileSync(sourceScriptPath, 'utf-8');
        let shouldWriteFile = true;
        // 检查文件是否存在
        if (fs.existsSync(runtimeScriptPath)) {
            shouldWriteFile = false;
            console.log(`[${package_json_1.default.name}] Runtime script already exists and is up-to-date. Skipping injection.`);
        }
        if (shouldWriteFile) {
            // 写入文件
            fs.writeFileSync(runtimeScriptPath, sourceScriptContent, 'utf-8');
            await new Promise(function (resolve) {
                setTimeout(() => {
                    resolve(null);
                }, 1000);
            });
            // 刷新资源
            console.log(`[${package_json_1.default.name}] Runtime script written to ${runtimeScriptPath}`);
            const refreshResult = await Editor.Message.request("asset-db", "refresh-asset", `db://assets/${runtimeScriptName}`);
        }
    }
    catch (error) {
        console.error(`[${package_json_1.default.name}] Error injecting runtime script:`, error);
    }
};
exports.load_ts_to_runtime = load_ts_to_runtime;
/** 移除运行时代码 */
const unload_ts_from_runtime = async () => {
    try {
        console.log(`[${package_json_1.default.name}] Removing runtime script...`);
        // 删除文件
        if (fs.existsSync(runtimeScriptPath)) {
            fs.unlinkSync(runtimeScriptPath);
            console.log(`[${package_json_1.default.name}] Runtime script removed: ${runtimeScriptPath}`);
        }
        if (fs.existsSync(runtimeMetaPath)) {
            fs.unlinkSync(runtimeMetaPath);
            console.log(`[${package_json_1.default.name}] Meta file removed: ${runtimeMetaPath}`);
        }
        await new Promise(function (resolve) {
            setTimeout(() => {
                resolve(null);
            }, 1000);
        });
        // 刷新资源
        const refreshResult = await Editor.Message.request("asset-db", "refresh-asset", `db://assets/${runtimeScriptName}`);
    }
    catch (error) {
        console.error(`[${package_json_1.default.name}] Error removing runtime script:`, error);
    }
};
exports.unload_ts_from_runtime = unload_ts_from_runtime;
