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
    ready() {
        console.log("aaaaaaaa启动1123")
        console.log("ssssssssaa",_funcs.getCurPluginPath())
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

        registerF5()
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
    }, 1000);
}

function registerF5(){
    window.addEventListener('keyup', (event) => {
        // console.log('Global keydown event:', event.key);
        
        if(event.key=="F5"){
            console.log("按了F5")
            Editor.Message.send(_funcs.getPluginName(),"restart-self")
        }
      });
}