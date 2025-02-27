import { IBuildPaths, IBuildTaskOption } from '../../@types/packages/builder/@types';
import packageJSON from '../../package.json'
import { _funcs } from '../tools/_funcs';
import { _pluginSocket } from '../tools/plugin_socket';
import { applyBuildParamAfter, applyBuildParamBefore, load_ts_to_runtime, unload_ts_from_runtime } from '../tools/runtime_socket_helper';
const { pathExistsSync, writeFileSync, readFileSync } = require('fs-extra');

console.log("packageJSON",packageJSON)

export const methods = {
    async open_main() {
        console.log("点击打开主面板")
        Editor.Panel.open(packageJSON.name);
    },
    
    async restart_self_ui(){
        

        console.log("收到消息restart_self_ui")
        await Editor.Panel.close(packageJSON.name);

        const otherPanels = {
            [packageJSON.name+".eval_panel"] : false,
            [packageJSON.name+".log_panel"] : false,
            [packageJSON.name+".dynamicTexture_panel"] : false,
            [packageJSON.name+".localCache_panel"] : false,
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
    async onBeforeBuild(options:IBuildTaskOption){
        // console.error(`----------onBeforeBuild:${JSON.stringify(options,null,2)}`)
        const cfg = options?.packages?.cc_debuger_realtime as SelfBuildParam
        // console.log(`构建配置:${JSON.stringify(cfg,null,2)}`)
        return await applyBuildParamBefore(cfg)
    },
    async onAfterBuild(options:IBuildTaskOption,dest:string,paths){
        const app_js_path = paths?.cache?.applicationJS
        // console.log(`----------onAfterBuild,${dest}`)
        
        // console.log(`options:${JSON.stringify(options,null,2)}`)
        // console.log(`paths:${JSON.stringify(paths,null,2)}`)

        const bExist = await pathExistsSync(app_js_path)
        // console.log(`indexjs:${app_js_path},bExist:${bExist}`)
        if(bExist){
            let str = readFileSync(app_js_path);
            // // console.warn(`str:${str}`)
            str = str + "\n" + log_intercept_str;
            writeFileSync(app_js_path, str);
        }
        const cfg = options?.packages?.cc_debuger_realtime as SelfBuildParam

        return applyBuildParamAfter(cfg)
    }
};

const log_intercept_str = `
window["cc_debuger_intercept_log"] = function(){
  if(!window["cc_debuger_log_intercepted"]){
    window["cc_debuger_log_intercepted"] = true;
      ["log", "warn", "error"].forEach(level => {
      const originalMethod = console[level];

      console[level] = (...args) => {
        if(window["cc_debuger_handleLog"]){
            window["cc_debuger_handleLog"](level, args);
        }
        return originalMethod.apply(console, args);
      };
    });
  }
}
window["cc_debuger_intercept_log"]()
`;

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
