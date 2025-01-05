const fs = require('fs-extra');
const path = require("path")


import { _funcs } from './_funcs';

const runtimeScriptName = 'runtime_socket.ts';
const runtimeScriptPath = path.join(Editor.Project.path, 'assets', runtimeScriptName);
const runtimeMetaPath = runtimeScriptPath + '.meta';

export const load_ts_to_runtime = async () => {
    try {
        console.log(`[${_funcs.getPluginName()}] Injecting runtime script...`);

        const sourceScriptPath = path.join(_funcs.getCurPluginPath(), "src/tools/", runtimeScriptName);
        const sourceScriptContent = fs.readFileSync(sourceScriptPath, 'utf-8');

        let shouldWriteFile = true;

        // 检查文件是否存在
        if (fs.existsSync(runtimeScriptPath)) {
            shouldWriteFile = false
            console.log(`[${_funcs.getPluginName()}] Runtime script already exists and is up-to-date. Skipping injection.`);
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
            console.log(`[${_funcs.getPluginName()}] Runtime script written to ${runtimeScriptPath}`);
            const refreshResult = await Editor.Message.request(
                "asset-db",
                "refresh-asset",
                `db://assets/${runtimeScriptName}`
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
        if (fs.existsSync(runtimeScriptPath)) {
            fs.unlinkSync(runtimeScriptPath);
            console.log(`[${_funcs.getPluginName()}] Runtime script removed: ${runtimeScriptPath}`);
        }
        if (fs.existsSync(runtimeMetaPath)) {
            fs.unlinkSync(runtimeMetaPath);
            console.log(`[${_funcs.getPluginName()}] Meta file removed: ${runtimeMetaPath}`);
        }

        await new Promise(function (resolve) {
            setTimeout(() => {
                resolve(null)
            }, 1000);
        })

        // 刷新资源
        const refreshResult = await Editor.Message.request(
            "asset-db",
            "refresh-asset",
            `db://assets/${runtimeScriptName}`
        );
    } catch (error) {
        console.error(`[${_funcs.getPluginName()}] Error removing runtime script:`, error);
    }
};
