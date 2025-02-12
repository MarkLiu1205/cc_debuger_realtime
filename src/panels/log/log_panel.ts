import { createApp } from 'vue';
import '../main/style.css';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../tools/_funcs';
import { _serverSocket } from '../../tools/server_socket';
import { _pluginSocket } from '../../tools/plugin_socket';
import LogApp from './LogApp.vue';

const weakMap = new WeakMap();

export default Editor.Panel.define({
    template: '<div id="app" class="dark"></div>', // 只留一个 div 用于 vue 的挂载
    $: {
        root: '#app',
    },
    methods: {
        sendRuntimeLog(logStr:string){
            console.log("收到日志",logStr)
            try{
                const obj:LogEntry = JSON.parse(logStr)
            }catch(e){
                
            }
        }
    },
    ready() {
        console.log("eval——panel ready")
        if (!this.$.root) return;

        const app = createApp(LogApp);
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

        _funcs.registerF5()
    },
    close() {
        const app = weakMap.get(this);
        app?.unmount?.();

    },
});

