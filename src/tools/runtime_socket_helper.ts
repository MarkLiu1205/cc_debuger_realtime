const fs = require('fs-extra');
const path = require("path")


import { _funcs } from './_funcs';

const runtimeScriptName_1 = 'cc_debuger_1.ts';
const runtimeScriptName_2 = 'cc_debuger_2_ugly.ts';

const runtimeScriptName_3 = 'ccdebuger.pako.min.js';
const sourceScriptPath_3 = path.join(_funcs.getCurPluginPath(), "src/tools/", runtimeScriptName_3);

const sourceScriptPath_1 = path.join(_funcs.getCurPluginPath(), "runtime/", runtimeScriptName_1);
const sourceScriptPath_2 = path.join(_funcs.getCurPluginPath(), "runtime/", runtimeScriptName_2);

const runtimeScriptPath_1 = path.join(Editor.Project.path, 'assets', runtimeScriptName_1);
const runtimeMetaPath_1 = runtimeScriptPath_1 + '.meta';

const runtimeScriptPath_2 = path.join(Editor.Project.path, 'assets', runtimeScriptName_2);
const runtimeMetaPath_2 = runtimeScriptPath_2 + '.meta';

const runtimeScriptPath_3 = path.join(Editor.Project.path, 'assets', runtimeScriptName_3);
const runtimeMetaPath_3 = runtimeScriptPath_3 + '.meta';

let _oldContent_ts:string;
let _oldContent_meta:string;

export const applyBuildParamBefore = async (cfg:SelfBuildParam)=>{
    const cut_plugin_from_runtime = cfg?.cut_plugin_from_runtime
    const bAutoStarPlugin = cfg?.bAutoStarPlugin
    const serverAddress = cfg?.serverAddress
    // console.log("cut_plugin_from_runtime",cut_plugin_from_runtime)
    // console.log("bAutoStarPlugin",bAutoStarPlugin)
    // console.log("serverAddress",serverAddress)
    if (!fs.existsSync(runtimeScriptPath_1)) {
        return
    }
    _oldContent_ts = fs.readFileSync(runtimeScriptPath_1, 'utf-8');
    _oldContent_meta = fs.readFileSync(runtimeMetaPath_1, 'utf-8');
    if(cut_plugin_from_runtime){
        await unload_ts_from_runtime()
    }else{
        const sourceScriptContent = fs.readFileSync(runtimeScriptPath_1, 'utf-8');
        let newStr = sourceScriptContent.replace(
            /bAutoStart\s*=\s*(true|false)/, 
            `bAutoStart = ${bAutoStarPlugin}`
        );
        newStr = newStr.replace(
            /plugin_server_address\s*=\s*([`"'])(.*?)\1/,
            `plugin_server_address = \`${serverAddress}\``
        );
        fs.writeFileSync(runtimeScriptPath_1, newStr, 'utf-8');

        // 刷新资源
        await Editor.Message.request(
            "asset-db",
            "refresh-asset",
            `db://assets/${runtimeScriptName_1}`
        );
    }
    return 0
}

export const applyBuildParamAfter = async(cfg:SelfBuildParam)=>{
    // console.log("结束构建",_oldContent_meta?.length)
    if(_oldContent_ts){
        fs.writeFileSync(runtimeScriptPath_1, _oldContent_ts, 'utf-8');
    }
    if(_oldContent_meta){
        fs.writeFileSync(runtimeMetaPath_1, _oldContent_meta, 'utf-8');
    }
    await Editor.Message.request(
        "asset-db",
        "refresh-asset",
        `db://assets/${runtimeScriptName_1}`
    );
}

export const load_ts_to_runtime = async () => {
    try {
        console.log(`[${_funcs.getPluginName()}] Injecting runtime script...`);
        let isAssetDbReady = false
        for(let i=0;i<120;i++){
            isAssetDbReady = await Editor.Message.request(
                "asset-db",
                "query-ready"
            );
            // console.log("isAssetDbReady",isAssetDbReady,i)
            if(isAssetDbReady){
                break
            }
            await _funcs.waitForSeconds(1)
        }
        if(!isAssetDbReady){
            return
        }
        {
            const sourceScriptContent = fs.readFileSync(sourceScriptPath_3, 'utf-8');

            // 写入文件
            fs.writeFileSync(runtimeScriptPath_3, sourceScriptContent, 'utf-8');

            // 刷新资源
            console.log(`[${_funcs.getPluginName()}] Runtime script written to ${runtimeScriptPath_3}`);
            await Editor.Message.request(
                "asset-db",
                "refresh-asset",
                `db://assets/${runtimeScriptName_3}`
            );
        }
        
        {
            const sourceScriptContent = fs.readFileSync(sourceScriptPath_2, 'utf-8');

            // 写入文件
            fs.writeFileSync(runtimeScriptPath_2, sourceScriptContent, 'utf-8');

            // 刷新资源
            console.log(`[${_funcs.getPluginName()}] Runtime script written to ${runtimeScriptPath_2}`);
            await Editor.Message.request(
                "asset-db",
                "refresh-asset",
                `db://assets/${runtimeScriptName_2}`
            );
        }

        {
            const sourceScriptContent = fs.readFileSync(sourceScriptPath_1, 'utf-8');

            // 写入文件
            fs.writeFileSync(runtimeScriptPath_1, sourceScriptContent, 'utf-8');

            // 刷新资源
            console.log(`[${_funcs.getPluginName()}] Runtime script written to ${runtimeScriptPath_1}`);
            await Editor.Message.request(
                "asset-db",
                "refresh-asset",
                `db://assets/${runtimeScriptName_1}`
            );
        }
        
    } catch (error) {
        console.error(`[${_funcs.getPluginName()}] Error injecting runtime script:`, error);
    }
};

/** 移除运行时代码 */
export const unload_ts_from_runtime = async () => {
    try {
        console.log(`[${_funcs.getPluginName()}] Removing runtime script...`);

        // 删除文件
        if (fs.existsSync(runtimeScriptPath_1)) {
            fs.unlinkSync(runtimeScriptPath_1);
            console.log(`[${_funcs.getPluginName()}] Runtime script removed: ${runtimeScriptPath_1}`);
        }
        if (fs.existsSync(runtimeScriptPath_2)) {
            fs.unlinkSync(runtimeScriptPath_2);
            console.log(`[${_funcs.getPluginName()}] Runtime script removed: ${runtimeScriptPath_2}`);
        }
        if (fs.existsSync(runtimeScriptPath_3)) {
            fs.unlinkSync(runtimeScriptPath_3);
            console.log(`[${_funcs.getPluginName()}] Runtime script removed: ${runtimeScriptPath_3}`);
        }
        if (fs.existsSync(runtimeMetaPath_1)) {
            fs.unlinkSync(runtimeMetaPath_1);
            console.log(`[${_funcs.getPluginName()}] Meta file removed: ${runtimeMetaPath_1}`);
        }
        if (fs.existsSync(runtimeMetaPath_2)) {
            fs.unlinkSync(runtimeMetaPath_2);
            console.log(`[${_funcs.getPluginName()}] Meta file removed: ${runtimeMetaPath_2}`);
        }
        if (fs.existsSync(runtimeMetaPath_3)) {
            fs.unlinkSync(runtimeMetaPath_3);
            console.log(`[${_funcs.getPluginName()}] Meta file removed: ${runtimeMetaPath_3}`);
        }

        // 刷新资源
        await Editor.Message.request(
            "asset-db",
            "refresh-asset",
            `db://assets/${runtimeScriptName_1}`
        );
        await Editor.Message.request(
            "asset-db",
            "refresh-asset",
            `db://assets/${runtimeScriptName_2}`
        );
    } catch (error) {
        console.error(`[${_funcs.getPluginName()}] Error removing runtime script:`, error);
    }
};
