import { IBuildTaskOption, BuildHook, IBuildResult } from '../@types';

interface IOptions {
    /**是否剔除cc_debuger,(构建时从assets中剔除相关插件代码) */
    cut_plugin_from_runtime:boolean,
    /**是否自动连接插件 */
    bAutoStarPlugin:boolean,
    /**中转websocket服务器地址 */
    serverAddress:boolean
}

const PACKAGE_NAME = 'cc_debuger_realtime';

interface ITaskOptions extends IBuildTaskOption {
    packages: {
        'cc_debuger_realtime': IOptions;
    };
}


let allAssets = [];

export const throwError: BuildHook.throwError = true;

export const load: BuildHook.load = async function() {
    console.log(`[${PACKAGE_NAME}] Load cocos plugin example in builder.`);
    allAssets = await Editor.Message.request('asset-db', 'query-assets');
};

export const onBeforeBuild: BuildHook.onBeforeBuild = async function(options: ITaskOptions, result: IBuildResult) {
    // Todo some thing
    // console.error("onBeforeBuild: "+JSON.stringify(options))
    await Editor.Message.request("cc_debuger_realtime","onBeforeBuild",options)
};

export const onBeforeCompressSettings: BuildHook.onBeforeCompressSettings = async function(options: ITaskOptions, result: IBuildResult) {
    const pkgOptions = options.packages[PACKAGE_NAME];
    // if (pkgOptions.webTestOption) {
    //     console.debug('webTestOption', true);
    // }
    // // Todo some thing
    // console.debug('get settings test', result.settings);
};

export const onAfterCompressSettings: BuildHook.onAfterCompressSettings = async function(options: ITaskOptions, result: IBuildResult) {
    // Todo some thing
    // console.log('webTestOption', 'onAfterCompressSettings');
};

export const onAfterBuild: BuildHook.onAfterBuild = async function(options: ITaskOptions, result: IBuildResult) {
    Editor.Message.request("cc_debuger_realtime","onAfterBuild",options,result.dest,result.paths)
};

export const unload: BuildHook.unload = async function() {
    // console.log(`[${PACKAGE_NAME}] Unload cocos plugin example in builder.`);
};

export const onError: BuildHook.onError = async function(options, result) {
    // Todo some thing
    console.warn(`${PACKAGE_NAME} run onError`);
};

export const onBeforeMake: BuildHook.onBeforeMake = async function(root, options) {
    // console.log(`onBeforeMake: root: ${root}, options: ${options}`);
};

export const onAfterMake: BuildHook.onAfterMake = async function(root, options) {
    // console.log(`onAfterMake: root: ${root}, options: ${options}`);
};
