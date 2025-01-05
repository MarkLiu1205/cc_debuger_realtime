"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
// @ts-ignore
const package_json_1 = __importDefault(require("../package.json"));
const _funcs_1 = require("./tools/_funcs");
const runtime_socket_helper_1 = require("./tools/runtime_socket_helper");
/**
 * @en
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    openPanel() {
        console.log("点击打开主面板");
        Editor.Panel.open(package_json_1.default.name);
    },
    async restart_self_ui() {
        if (1) {
            const buildCmd = _funcs_1._funcs.getCurPluginPath() + "/" + "build_tsc.bat";
            await _funcs_1._funcs.runCmdSpawn(buildCmd, [_funcs_1._funcs.getCurPluginPath()]);
        }
        console.log("收到消息restart_self_ui");
        Editor.Panel.close(package_json_1.default.name);
        setTimeout(() => {
            console.log("时间到重启");
            Editor.Panel.open(package_json_1.default.name);
        }, 1000);
    }
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    console.log(`插件 [${package_json_1.default.name}] 已安装`);
    (0, runtime_socket_helper_1.load_ts_to_runtime)();
}
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() {
    console.log(`插件 [${package_json_1.default.name}] 已卸载`);
    (0, runtime_socket_helper_1.unload_ts_from_runtime)();
}
exports.unload = unload;
