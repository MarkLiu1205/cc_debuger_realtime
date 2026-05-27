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

/** 把字符串转成合法的 JS 双引号字符串字面量(额外转义 U+2028/U+2029，旧版 JS 字符串内非法) */
const _toJsStringLiteral = (s:string):string => {
    const _ls = String.fromCharCode(0x2028);
    const _ps = String.fromCharCode(0x2029);
    return JSON.stringify(s).split(_ls).join("\\u2028").split(_ps).join("\\u2029");
};

/**
 * 把 cc_debuger_2_ugly.ts 与 pako 的内容内嵌进 cc_debuger_1.ts 源码字符串。
 * 用正则整行替换 LOCAL_CC_DEBUGER_2_JS / LOCAL_PAKO_JS 的占位声明；
 * 内容为空时保留占位串，cc_debuger_1.ts 运行时会自动回退到远程下载。
 * 使用函数式 replace 回调，避免内容中的 `$` 被当成替换模式。
 */
const _inlineRuntimeContent = (content1:string, js2:string, pako:string):string => {
    if (js2 && js2.length > 0) {
        const lit = _toJsStringLiteral(js2);
        content1 = content1.replace(
            /const LOCAL_CC_DEBUGER_2_JS\s*=\s*"[^"]*";/,
            () => `const LOCAL_CC_DEBUGER_2_JS = ${lit};`
        );
    }
    if (pako && pako.length > 0) {
        const lit = _toJsStringLiteral(pako);
        content1 = content1.replace(
            /const LOCAL_PAKO_JS\s*=\s*"[^"]*";/,
            () => `const LOCAL_PAKO_JS = ${lit};`
        );
    }
    return content1;
};

export const applyBuildParamBefore = async (cfg:SelfBuildParam)=>{
    const cut_plugin_from_runtime = cfg?.cut_plugin_from_runtime
    const bAutoStarPlugin = cfg?.bAutoStarPlugin
    const serverAddress = cfg?.serverAddress
    // console.log("cut_plugin_from_runtime",cut_plugin_from_runtime)
    // console.log("bAutoStarPlugin",bAutoStarPlugin)
    // console.log("serverAddress",serverAddress)
    if (!fs.existsSync(runtimeScriptPath_1)) {
        return 0
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
    console.log("结束构建",_oldContent_meta?.length,"cfg?.cut_plugin_from_runtime",cfg?.cut_plugin_from_runtime)
    const cut_plugin_from_runtime = cfg?.cut_plugin_from_runtime
    if(cut_plugin_from_runtime){
        await load_ts_to_runtime()
    }else{
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
        // 本地打包策略：把 cc_debuger_2_ugly.ts 与 pako 的内容内嵌进 cc_debuger_1.ts(它一定会被引擎执行)，
        // 这样运行时不再依赖远程 ccdebuger.com。本地缺失时保留占位串，cc_debuger_1.ts 会自动回退到远程加载。
        let inlineJs2 = '';
        if (fs.existsSync(sourceScriptPath_2)) {
            inlineJs2 = fs.readFileSync(sourceScriptPath_2, 'utf-8');
        } else {
            console.log(`[${_funcs.getPluginName()}] cc_debuger_2_ugly.ts not found locally, runtime will load it remotely: ${sourceScriptPath_2}`);
        }
        let inlinePako = '';
        if (fs.existsSync(sourceScriptPath_3)) {
            inlinePako = fs.readFileSync(sourceScriptPath_3, 'utf-8');
        } else {
            console.log(`[${_funcs.getPluginName()}] pako not found locally, runtime will load it remotely: ${sourceScriptPath_3}`);
        }

        {
            let content1 = fs.readFileSync(sourceScriptPath_1, 'utf-8');
            content1 = _inlineRuntimeContent(content1, inlineJs2, inlinePako);

            // 写入文件(已内嵌运行时与 pako)
            fs.writeFileSync(runtimeScriptPath_1, content1, 'utf-8');

            // 刷新资源
            console.log(`[${_funcs.getPluginName()}] Runtime script written to ${runtimeScriptPath_1} (inlined js2=${inlineJs2.length}, pako=${inlinePako.length})`);
            await Editor.Message.request(
                "asset-db",
                "refresh-asset",
                `db://assets/${runtimeScriptName_1}`
            );
        }

        // 内嵌后不再需要独立的 _2 / _3 资产，清理掉历史遗留的，避免冗余与潜在的重复执行。
        const _staleAssets = [
            { p: runtimeScriptPath_2, name: runtimeScriptName_2 },
            { p: runtimeScriptPath_3, name: runtimeScriptName_3 },
        ];
        for (const item of _staleAssets) {
            let removed = false;
            if (fs.existsSync(item.p)) { fs.unlinkSync(item.p); removed = true; }
            const metaPath = item.p + '.meta';
            if (fs.existsSync(metaPath)) { fs.unlinkSync(metaPath); removed = true; }
            if (removed) {
                console.log(`[${_funcs.getPluginName()}] Removed redundant deployed asset: ${item.p}`);
                await Editor.Message.request(
                    "asset-db",
                    "refresh-asset",
                    `db://assets/${item.name}`
                );
            }
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
