import MainApp from './MainApp.vue';
import { createApp } from 'vue';
import './style.css';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../tools/_funcs';
import { _serverSocket } from '../../tools/server_socket';
import { _pluginSocket } from '../../tools/plugin_socket';

const weakMap = new WeakMap();

export default Editor.Panel.define({
    template: '<div id="app" class="dark"></div>', // 只留一个 div 用于 vue 的挂载
    $: {
        root: '#app',
        appInst: null as any,
    },
    methods: {
        async doEvalJs(str) {
            return await _pluginSocket.evalJsInRuntime(str)
        },
        async callMainPanelFunc(instStr:string,funcName:string,...args){
            if(instStr=="_pluginSocket"){
                let inst = _pluginSocket;
                let _func = inst[funcName] as Function
                if(_func){
                    return _func.apply(inst,args)
                }else{
                    console.error(`${instStr}不存在方法${funcName}`)
                }
            }
        }
    },
    ready() {
        if (!this.$.root) return;

        const app = createApp(MainApp);
        app.provide('appRoot', this.$.root);
        app.provide('message', (options,type?:"error" | "success" | "warning" | "info") => {
            if (typeof options === 'string') {
                options = { message: options };
            }
            if(type){
                options.type = type
            }
            options.appendTo = options.appendTo || this.$.root;
            return ElMessage(options);
        });
        const appInst = app.mount(this.$.root);
        this.$.appInst = appInst;

        weakMap.set(this, app);

        startServer(appInst)

        _funcs.registerF5()

    },
    close() {
        const app = weakMap.get(this);
        app?.unmount?.();

        _serverSocket.stop()
        _funcs.stopSpawnProcess()
    },
});


async function startServer(appInst) {
    const _fs = _funcs.getFs()
    const ip = _funcs.getLocalIpv4IP()
    const port = await _funcs.findAvailablePort(8085)
    if(_pluginSocket.checkIsConnect()){
        return
    }
    let wsAddress = `ws://${ip}:${port}`
    const jsonCfgPath = await _funcs.getLocalServerJsonPath()
    let obj = null
    try{
        obj = _fs.readJSONSync(jsonCfgPath)
    }catch(e){
        
    }
    obj = {
        ip,
        port,
        ws:obj?.ws
    }
        
    if(obj.ws){
        wsAddress = obj.ws;//用户手动选择的websocket服务器地址
    }else{
        delete obj.ws
    }
    
    _fs.writeFileSync(jsonCfgPath,JSON.stringify(obj,null,4))

    // _funcs.log_1("本机端口号",port)
    _serverSocket.start(`${port}`)

    if(appInst?.setSocketAddress!=null){
        appInst.setSocketAddress(wsAddress)
    }
   
    setTimeout(() => {
        _pluginSocket.connectToServer(wsAddress)
        
        listenForLog()
    }, 1000);
}

function listenForLog(){
    _pluginSocket.listenRuntimeLog((obj:LogEntry)=>{
        Editor.Message.send(_funcs.getPluginName(),"sendRuntimeLog",JSON.stringify(obj))
    })
}