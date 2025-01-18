import App from './App.vue';
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


function startServer() {
    let debugPort = 8085
    _serverSocket.start(`${debugPort}`)

    _pluginSocket.connectToServer(`ws://localhost:${debugPort}`)
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