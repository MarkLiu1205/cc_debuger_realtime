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
    },
    methods: {
        async doEvalJs(str) {
            return await _pluginSocket.evalJsInRuntime(str)
        },
        async doWaitForRuntimeIsInline() {
            return await _pluginSocket.waitForRuntimeIsInline()
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
        app.provide('message', (options) => {
            if (typeof options === 'string') {
                options = { message: options+"  jjjj99" };
            }
            options.appendTo = options.appendTo || this.$.root;
            return ElMessage(options);
        });
        app.mount(this.$.root);

        weakMap.set(this, app);

        startServer()

        _funcs.registerF5()

    },
    close() {
        const app = weakMap.get(this);
        app?.unmount?.();

        _serverSocket.stop()
        _funcs.stopSpawnProcess()
    },
});


async function startServer() {
    const debugPort = await _funcs.findAvailablePort(8085)
    if(_pluginSocket.checkIsConnect()){
        return
    }
    _funcs.log_1("本机端口号",debugPort)
    _serverSocket.start(`${debugPort}`)
   
    setTimeout(() => {
        _pluginSocket.connectToServer(`ws://localhost:${debugPort}`)

        listenForLog()
    }, 1000);
}

function listenForLog(){
    _pluginSocket.listenRuntimeLog((obj:LogEntry)=>{
        Editor.Message.send(_funcs.getPluginName(),"sendRuntimeLog",JSON.stringify(obj))
    })
}