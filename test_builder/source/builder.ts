import { BuildPlugin } from '../@types';
import fs from "fs-extra"

const PACKAGE_NAME = 'cc_debuger_realtime';

let _wsDefault = "ws://localhost:8085"

export const load: BuildPlugin.load = function() {

    const jsonCfgPath = Editor.Package.getPath(PACKAGE_NAME)+"/cache/localServer.json"
    if(fs.existsSync(jsonCfgPath)){
        let obj = null
        try{
            obj = fs.readJSONSync(jsonCfgPath)
        }catch(e){
            
        }
        if(obj==null){
            return
        }
        let _opts = configs as any;
        _opts = _opts["*"]?.options
        
        let addressUrl = null
        if(obj?.ip&&obj?.port){//默认连接本机服务器
            addressUrl = `ws://${obj.ip}:${obj.port}`
        }
        if(addressUrl){
            _wsDefault = obj.ws
            if(_opts?.serverAddress){
                _opts.serverAddress.default = obj.ws
            }
        }
    }
};

export const unload: BuildPlugin.load = function() {
    console.debug(`${PACKAGE_NAME} unload`);
};

export const configs: BuildPlugin.Configs = {
    '*': {
        hooks: './hooks',
        doc: 'editor/publish/custom-build-plugin.html',
        options: {
            cut_plugin_from_runtime: {
                label: `是否剔除cc_debuger`,
                description:"是否从assets中剔除相关插件代码，如在publish版本中不需要调试功能，可勾选此选项",
                default: false,
                render: {
                    ui: 'ui-checkbox',
                },
            },
            bAutoStarPlugin: {
                label: `是否自动连接插件`,
                default: true,
                description:"（未剔除情况下有意义）启动app后，是否自动连接cc_debuger插件，不勾选的话，则由app自择合适时机来连接",
                render: {
                    ui: 'ui-checkbox',
                },
            },
            serverAddress: {
                label: `中转服务器地址`,
                default: _wsDefault,
                description:"（未剔除情况下有意义）",
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '',
                    },
                },
                verifyRules: ['required','wsServerUrl'],
            },
        },
        verifyRuleMap: {
            ruleTest: {
                message: `i18n:${PACKAGE_NAME}.options.ruleTest_msg`,
                func(val, buildOptions) {
                    if (val === 'cocos') {
                        return true;
                    }
                    return false;
                },
            },
            wsServerUrl:{
                message:"必须填写有效的websocket地址,以 'ws://' 或 'wss://' 开头",
                func(val, buildOptions) {
                    if (val.startsWith("ws://")||val.startsWith("wss://")) {
                        return true;
                    }
                    return false;
                },
            }
        },
    },
};

export const assetHandlers: BuildPlugin.AssetHandlers = './asset-handlers';
