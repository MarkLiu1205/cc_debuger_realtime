import packageJSON from '../../package.json'
import { _funcs } from '../tools/_funcs';
import { _pluginSocket } from '../tools/plugin_socket';
import { load_ts_to_runtime, unload_ts_from_runtime } from '../tools/runtime_socket_helper';

console.log("packageJSON",packageJSON)

export const methods = {
    async open_main() {
        console.log("点击打开主面板")
        Editor.Panel.open(packageJSON.name);
    },
    
    async restart_self_ui(){
        

        console.log("收到消息restart_self_ui")
        Editor.Panel.close(packageJSON.name);

        const otherPanels = {
            [packageJSON.name+".eval_panel"] : false,
            [packageJSON.name+".log_panel"] : false,
        }
        for(let k in otherPanels){
            otherPanels[k] = await Editor.Panel.has(k)
            if(otherPanels[k]){
                Editor.Panel.close(k)
            }
        }
        
        setTimeout(async ()=>{
            console.log("时间到重启")
            await Editor.Panel.open(packageJSON.name);

            for(let k in otherPanels){
                if(otherPanels[k]){
                    await new Promise((resolve)=>{setTimeout(() => {
                        resolve(null)
                    }, 2000);})
                    await Editor.Panel.open(k);
                }
            }
        },2000)
    },
    
    async do_eval_js(str:string){
        console.log("zzzzz 1")
        const result = await _pluginSocket.evalJsInRuntime(str)
        console.log("zzzzz 2")
        console.log(result)
        return result
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
