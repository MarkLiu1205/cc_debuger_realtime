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
        appInst: null as any, // 用于存储 LogApp 实例
    },
    methods: {
        sendRuntimeLog(obj:LogEntry){
            if(typeof obj=="string"){
                try{
                    obj = JSON.parse(obj)
                }catch(e){

                }
            }
            // console.log("收到日志",obj)
            if(this.$.appInst?.addLog){
                this.$.appInst.addLog(obj.message,obj.level,obj.timestamp)
            }
        },
        onRuntimeOnlineState(bIsOnline:boolean){
            // console.log("在线信息",bIsOnline)
            if(this.$.appInst?.checkOnlineInfo!=null){
                this.$.appInst.checkOnlineInfo(bIsOnline)
            }
        }
    },
    ready() {
        // console.log("eval——panel ready")
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
        const appInst = app.mount(this.$.root);
        this.$.appInst = appInst;

        weakMap.set(this, app);

        _funcs.registerF5()
    },
    close() {
        const app = weakMap.get(this);
        app?.unmount?.();

    },
});

