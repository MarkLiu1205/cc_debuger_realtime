import MainApp from './MainApp.vue';
import { createApp } from 'vue';
import './style.css';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../tools/_funcs';
import { _serverSocket } from '../../tools/server_socket';
import { _pluginSocket } from '../../tools/plugin_socket';
import { eventBus } from '../../tools/_enentBus';

const weakMap = new WeakMap();

export default Editor.Panel.define({
    template: '<div id="app" class="dark"></div>', // 只留一个 div 用于 vue 的挂载
    $: {
        root: '#app',
        appInst: null as any,
    },
    methods: {
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

        _funcs.checkNodeJsEnable()

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


/**
 * runtime 端寫死連 ws://localhost:8085,而 server 綁所有網卡,因此固定用 8085;
 * 不再用 findAvailablePort 漂移到 8086+,否則會出現「runtime 連 8085、plugin 連 8086」分家。
 */
const DEFAULT_SERVER_PORT = 8085

async function startServer(appInst) {
    const _fs = _funcs.getFs()
    const ip = _funcs.getLocalIpv4IP()
    const port = DEFAULT_SERVER_PORT
    if(_pluginSocket.checkIsConnect()){
        return
    }
    const jsonCfgPath = await _funcs.getLocalServerJsonPath()
    let obj = null
    try{
        obj = _fs.readJSONSync(jsonCfgPath)
    }catch(e){

    }
    const customWs = obj?.ws

    //自訂位址只有在「指向遠端機器」時才純連線不 spawn。
    //若指向本機(localhost / 本機任一張網卡的 IP),代表那台 server 其實就是自己,
    //沒有外部 server 可連,仍必須自己 spawn 一台本地 server,否則會連到不存在的位址。
    let bRemoteCustom = false
    if(customWs){
        const host = _funcs.getHostFromWsUrl(customWs)
        bRemoteCustom = !!host && !_funcs.checkIpIsLocalhost(host)
    }

    if(bRemoteCustom){
        //真正的遠端 server:用自訂位址、純連線、保留設定
        const wsAddress = customWs
        _fs.writeFileSync(jsonCfgPath, JSON.stringify({ ip, port, ws: customWs }, null, 4))
        if(appInst?.setSocketAddress!=null){
            appInst.setSocketAddress(wsAddress)
        }
        _pluginSocket.connectToServer(wsAddress)
        listenForLog()
        return
    }

    //本機:固定 8085,清掉指向本機的舊自訂位址(避免下次又誤判成遠端)
    const wsAddress = `ws://${ip}:${port}`
    _fs.writeFileSync(jsonCfgPath, JSON.stringify({ ip, port }, null, 4))
    if(appInst?.setSocketAddress!=null){
        appInst.setSocketAddress(wsAddress)
    }

    //8085 已有一台 server(通常是上一輪沒被回收、runtime 也正連著它)時直接重用,
    //不要再 spawn 一台,避免分家與 orphan 堆積。
    const bAlreadyRunning = await _funcs.isPortInUse(port)
    if(bAlreadyRunning){
        _pluginSocket.connectToServer(wsAddress)
        listenForLog()
        return
    }

    //8085 沒人用 → 自己 spawn 一台,等啟動完成再連(先註冊監聽避免 race)
    const _onServerStarted = ()=>{
        eventBus.off("localServerStarted",_onServerStarted)
        _pluginSocket.connectToServer(wsAddress)
        listenForLog()
    }
    eventBus.on("localServerStarted",_onServerStarted)
    _serverSocket.start(`${port}`)
}

function listenForLog(){
    _pluginSocket.listenRuntimeLog((obj:LogEntry)=>{
        Editor.Message.send(_funcs.getPluginName(),"sendRuntimeLog",JSON.stringify(obj))
    })
}