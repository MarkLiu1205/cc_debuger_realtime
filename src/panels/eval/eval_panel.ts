import { createApp } from 'vue';
import './style.css';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../tools/_funcs';
import { _serverSocket } from '../../tools/server_socket';
import { _pluginSocket } from '../../tools/plugin_socket';
import EvalApp from './EvalApp.vue';

const weakMap = new WeakMap();

export default Editor.Panel.define({
    template: '<div id="app" class="dark"></div>', // 只留一个 div 用于 vue 的挂载
    $: {
        root: '#app',
        appInst: null as any,
    },
    methods: {
        onRuntimeOnlineState(bIsOnline:boolean){
            if(this.$.appInst?.checkOnlineInfo!=null){
                this.$.appInst.checkOnlineInfo(bIsOnline)
            }
        },
        setDefaultEvalStr(param:string){
            if(this.$.appInst?.setInputStr!=null){
                this.$.appInst.setInputStr(param)
            }
        }
    },
    ready() {
        console.log("eval——panel ready")
        if (!this.$.root) return;

        const app = createApp(EvalApp);
        app.provide('appRoot', this.$.root);
        app.provide('message', (options) => {
            if (typeof options === 'string') {
                options = { message: options};
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

