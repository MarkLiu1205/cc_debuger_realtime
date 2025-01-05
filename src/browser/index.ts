import packageJSON from '../../package.json'
import { _funcs } from '../tools/_funcs';
import { load_ts_to_runtime, unload_ts_from_runtime } from '../tools/runtime_socket_helper';

console.log("packageJSON",packageJSON)

export const methods = {
    async open() {
        console.log("点击打开主面板")
        Editor.Panel.open(packageJSON.name);
    },
    async restart_self_ui(){
        

        console.log("收到消息restart_self_ui")
        Editor.Panel.close(packageJSON.name);

        setTimeout(()=>{
            console.log("时间到重启")
            Editor.Panel.open(packageJSON.name);

        },100)
    }
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() { 
    console.log(`插件 [${packageJSON.name}] 已安装`);
    load_ts_to_runtime()
}

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() { 
    console.log(`插件 [${packageJSON.name}] 已卸载`);
    unload_ts_from_runtime()
}
