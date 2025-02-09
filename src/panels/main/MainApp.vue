<script setup lang="ts">
import TestFlow from './components/TestFlow.vue';
import NodeTreeAndAssetList from './components/NodeTreeAndAssetList.vue';
import Inspector_Node from './components/Inspector_Node.vue';
import dlg_list_selecter from './components/dlg_list_selecter.vue';
import comp_node_selecter from './components/comp_node_selecter.vue';
import { computed, createVNode, h, inject, onMounted, onUnmounted, provide, reactive, ref, render, watch } from 'vue';
import { ElButton, ElDialog, ElMessage } from 'element-plus';
import { _funcs } from '../../tools/_funcs';
import { _dataCtx } from '../../tools/_dataCtx';
import { _pluginSocket } from '../../tools/plugin_socket';
import ScriptExecutor from './ScriptExecutor.vue'
import view_Node from './inspector/view_Node.vue'
import view_Sprite from './inspector/view_Sprite.vue'
import view_Label from './inspector/view_Label.vue'
import view_UITransform from './inspector/view_UITransform.vue'
import view_Button from './inspector/view_Button.vue'
import view_ParticleSystem from './inspector/view_ParticleSystem2D.vue';
import view_Layout from './inspector/view_Layout.vue';
import view_Skeleton from './inspector/view_Skeleton.vue';
import view_RichText from './inspector/view_RichText.vue';
import view_UIOpacity from './inspector/view_UIOpacity.vue';
import view_Camera from './inspector/view_Camera.vue';
import view_EditBox from './inspector/view_EditBox.vue';
import view_PageView from './inspector/view_PageView.vue';
import view_Mask from './inspector/view_Mask.vue';
import view_Scrollview from './inspector/view_Scrollview.vue';
import view_Graphics from './inspector/view_Graphics.vue';
import view_Widget from './inspector/view_Widget.vue';

/**客户端是否在线 */
const isRuntimeOffline = ref(true)
/**本地预览的地址 */
const runtimePreviewUrl = ref("http://localhost:7456")
/**当前已加载的bundle列表 */
const bundleNames = ref([])

/**资源树数据 */
const resTree_datas = ref([])

/**节点数数据 */
const nodeTree_datas = ref([]as Array<NodeTreeItem>)

const cur_sel_node = ref(null as InspectorInfo_Node)

provide('nodeTreeDatas', nodeTree_datas);


_pluginSocket.getNewAddedAssets().then((uuidMap:Record<string,number>)=>{
    console.log("全部列表",typeof uuidMap,uuidMap)
    _dataCtx.mark_using_uuids(uuidMap).then(() => {
        resTree_datas.value = _dataCtx.getResTree_datas()
    
        bundleNames.value = _dataCtx.m_bundleNames;
    })
})

_pluginSocket.listenRuntimeOnlineInfo((bIsOnline)=>{
    _funcs.log_1("runtime在线吗?",bIsOnline)
    isRuntimeOffline.value = !bIsOnline
    if(!bIsOnline){
        cur_sel_node.value = null
    }
})

_pluginSocket.listenRuntimeList((nameArr)=>{
    _funcs.log_1("runtime 列表：",JSON.stringify(nameArr))
})

function _updateNodeTreeKeys(node:NodeTreeItem){
    function traverse(node: NodeTreeItem) {
        node["key"] = node.path+""+node.uuid
        if (node.children) {
            node.children.forEach(child => traverse(child));
        }
    }
    traverse(node)
}

_pluginSocket.listenSceneNodeTree((data)=>{
    _funcs.log_1("节点树变化：",JSON.stringify(data,null,2))
    if(data){
        _updateNodeTreeKeys(data)
        _dataCtx.curNodeTreeInfo = data
        nodeTree_datas.value = [_dataCtx.curNodeTreeInfo]
    }
})

_pluginSocket.listenSceneLaunched((name)=>{
    _funcs.log_1("场景切换",name)
    cur_sel_node.value = null
})

const width_asset_list = ref(_funcs.clamp(200,500,window.innerWidth * 0.3)); // 默认左面板宽度占窗口宽度的30%
const width_node_tree = ref(_funcs.clamp(320,500,window.innerWidth * 0.3)); // 默认左面板宽度占窗口宽度的30%
const resizer_ele_1 = ref(null); //拉伸左右边界的线
const resizer_ele_2 = ref(null); //拉伸左右边界的线


watch(cur_sel_node, (newVal,old) => {
    if(old==null){
        return
    }
    if(newVal==null){
        return
    }
    // console.log("newVal",JSON.stringify(newVal))
    
    const oldVal = _dataCtx.curSelNodeInspectorInfo;
    // console.log("xxx",_dataCtx._curSelectNodeUuid)
    // console.log("oldVal",oldVal)
    if(oldVal==null){
        return
    }
    if(oldVal.uuid!=newVal.uuid){
        return
    }

    compareChangedNodeInfo(newVal,oldVal)
   
}, { deep: true })

function compareChangedNodeInfo(newVal:InspectorInfo_Node,oldVal:InspectorInfo_Node){
    const _obj:ChangedNodeInfo = {
        uuid:newVal.uuid,
        nodeChange:{},
        compChanges:{}
    }
    
    for (let key in newVal) {
        if (key === "components") {
            continue;
        }
        if (typeof newVal[key] === 'object' && newVal[key] !== null) {
            _obj.nodeChange = _obj.nodeChange ?? {};
            _obj.nodeChange[key] = deepCompare(newVal[key], oldVal[key]);
            if(_obj.nodeChange[key]==null){
                delete _obj.nodeChange[key]
            }
        } else if (newVal[key] !== oldVal[key]) {
            _obj.nodeChange = _obj.nodeChange ?? {};
            _obj.nodeChange[key] = newVal[key];
            // oldVal[key] = newVal[key];
        }
    }
    
    for(let i=0;i<newVal.components.length;i++){
        let newComp = newVal.components[i]
        let oldComp = oldVal.components[i];
        // console.log("newComp",JSON.stringify(newComp))
        // console.log("oldComp",JSON.stringify(oldComp))
        if(oldComp==null){
            break
        }

        for(let key in newComp){
            if (typeof newComp[key] === 'object' && newComp[key] !== null) {
                _obj.compChanges[newComp.uuid] = _obj.compChanges[newComp.uuid] ?? {};
                _obj.compChanges[newComp.uuid][key] = deepCompare(newComp[key], oldComp[key]);
                if(_obj.compChanges[newComp.uuid][key]==null){
                    delete _obj.compChanges[newComp.uuid][key]
                }
            } else if (newComp[key] !== oldComp[key]) {
                _obj.compChanges[newComp.uuid] = _obj.compChanges[newComp.uuid] ?? {};
                _obj.compChanges[newComp.uuid][key] = newComp[key];
                // oldComp[key] = newComp[key];
            }
            // console.log("_obj.compChanges[newComp.uuid]",_obj.compChanges[newComp.uuid])
            
        }
        if(_obj.compChanges[newComp.uuid]!=null && Object.keys(_obj.compChanges[newComp.uuid]).length==0){
            delete _obj.compChanges[newComp.uuid]
        }else{
            applyChange(oldComp,_obj.compChanges[newComp.uuid])
        }

    }
    if(Object.keys(_obj.nodeChange).length==0){
        delete _obj.nodeChange
    }else{
        applyChange(oldVal,_obj.nodeChange)
    }
    if(Object.keys(_obj.compChanges).length==0){
        delete _obj.compChanges
    }
    if(_obj.nodeChange==null && _obj.compChanges==null){
        return
    }
    console.log("节点改变",JSON.stringify(_obj))
    _pluginSocket.reqModifyNodeInfo(_obj)
}

/**递归比较两个对象 */
function deepCompare(newObj: any, oldObj: any) {
    if(oldObj==null){
        return null
    }
    let changes: Record<string, any> = {}
    for (let key in newObj) {
        if (typeof newObj[key] === 'object' && newObj[key] !== null) {
            if (!oldObj[key]) {
                changes[key] = newObj[key];
            } else {
                changes[key] = deepCompare(newObj[key], oldObj[key]);
                if (Object.keys(changes[key]).length === 0) {
                    delete changes[key];
                }
            }
        } else if (newObj[key] !== oldObj[key]) {
            changes[key] = newObj[key];
            // oldObj[key] = newObj[key];
        }
    }
    if(Object.keys(changes).length==0){
        return null
    }
    return changes;
}

function applyChange(oldoObj,changeMap:Record<string,any>){
    for(let key in changeMap){
        const oldVal = oldoObj[key]
        const newVal = changeMap[key]
        
        if(typeof newVal === "object"){
            applyChange(oldVal,newVal)
        }else{
            oldoObj[key] = newVal
        }
    }
}

const onMouseDown = (e:MouseEvent) => {
    const width_ref = e.target==resizer_ele_1.value?width_asset_list:width_node_tree
    const minWidth = e.target==resizer_ele_1.value?200:320
    
    const startX = e.clientX
    const startWidth = width_ref.value

    const onMouseMove = (moveEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX)
        // 限制最小和最大宽度
        width_ref.value = _funcs.clamp(minWidth,500,newWidth)
    }

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
}

onMounted(() => {
    _pluginSocket.waitForRuntimeIsInline().then(()=>{
        _funcs.waitForElementMounted(resizer_ele_1).then(()=>{
            resizer_ele_1.value.addEventListener('mousedown', onMouseDown);
        })
        _funcs.waitForElementMounted(resizer_ele_2).then(()=>{
            resizer_ele_2.value.addEventListener('mousedown', onMouseDown);
        })
    })

    _funcs.getRuntimePreviewUrl().then((url)=>{
        console.log("预览地址",url)
        runtimePreviewUrl.value = url
    })
    
})

onUnmounted(() => {
    if (resizer_ele_1.value) {
        resizer_ele_1.value.removeEventListener('mousedown', onMouseDown)
    }
    if (resizer_ele_2.value) {
        resizer_ele_2.value.removeEventListener('mousedown', onMouseDown)
    }
})  

function onSel_asset(item:ResTreeItem) {
    if(item.isAsset){
        console.log('选中资源:', item);
    }
}

function doOpenRuntimePreview() {
    _funcs.openWebSiteUrl(runtimePreviewUrl.value)
}

function onChange2ListView(){
    console.log("切换list 1")

    let obj = ""
    for(let i=0;i<1024*10;i++){
        obj += (i%9)+""
    }
    _pluginSocket._sendPush("test",obj)
}
function onChange2TreeView(){
    console.log("切换tree")
}

async function onSel_node(item:NodeTreeItem){
    // console.log('选中节点:', item);
    if(item==null){
        cur_sel_node.value = null
        return
    }
    
    let newVal = await _pluginSocket.getNodeInfo(item.uuid)
    // console.log(newVal)
    cur_sel_node.value = newVal
    _dataCtx.setCurSelectNodeInfo(JSON.parse(JSON.stringify(newVal)))
}

const scriptExecutorRef = ref(null);

async function openEvalPanel(event: MouseEvent){
    if(scriptExecutorRef.value!=null){
        scriptExecutorRef.value.openDialog(`return 'Hello World!'`); // 打开并预填代码
    }
}

async function testXX(){
    

    const panelId = _funcs.getPluginName()+".eval_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        const _callback = _pluginSocket.evalJsInRuntime.bind(_pluginSocket)
        console.log("panelId 2",panelId,_callback)
        await Editor.Panel.open(panelId,"aaaaaa",111);
        console.log("打开了吗2")
    }

    Editor.Message.request(_funcs.getPluginName(), 'testMsg',"return 'aa12'",123, false);
}

</script>

<template>
    <!-- <div style="width: 600px;height: 600px;">
        <TestFlow/>
    </div> -->
    <div style="width: 100vw; height: 100vh; ">  
        <div style=" width: calc(100% - 10px);height: calc(100% - 35px);">
            <div class="center-align" style="flex-direction: column;" v-if="isRuntimeOffline">
                <h2>没有检测到可用运行时</h2>
                <p>推荐打开预览：{{runtimePreviewUrl}}</p>
                <ui-button type="default"  @confirm="doOpenRuntimePreview">点击打开预览 {{runtimePreviewUrl}}</ui-button>
            </div>
            <div id="eid_view_main" class="cls_view_main" v-else>
                <div id="eid_view_asset_list" class="cls_view_asset_list" :style="{ width: width_asset_list + 'px' }">
                    
                    <NodeTreeAndAssetList
                        :resTree_datas="resTree_datas"
                        :nodeTree_datas="nodeTree_datas"
                        :bundleNames="bundleNames"
                        @onClick_node="onSel_node($event)"
                        @onClick_asset="onSel_asset($event)"
                    ></NodeTreeAndAssetList>
                </div>
                <div class="resizer-line-1" ref="resizer_ele_1"></div>
                <div id="eid_view_node_tree" class="cls_view_node_tree" :style="{ width: width_node_tree + 'px' }">
                    <Inspector_Node v-model="cur_sel_node"/>
                </div>
                <div class="resizer-line-1" ref="resizer_ele_2"></div>
                <div class="right-panel">

                    <h2 id="text-1" style="text-align: center;">哈哈哈哈哈哈2</h2>
                    <ui-button style="width: 100px;" @click="openEvalPanel">在runtime执行JS</ui-button>
                    <ui-button style="width: 100px;" @click="testXX">测试</ui-button>
                </div>
            </div>
            <ScriptExecutor ref="scriptExecutorRef" />
        </div>
        
    </div>
</template>

<style scoped>
.cls_view_main {
    display: flex;
    flex-direction: row;
    height: 100%; /* 使容器高度占满视口高度 */
    
}

.cls_view_asset_list {
    display: flex;
    flex-direction: column; 
    border: 1px solid black;
}

.resizer-line-1 {
    width: 2px; /* 分隔条宽度 */
    cursor: col-resize; /* 改变鼠标光标样式 */
    user-select: none; /* 禁止用户选择文本 */
    background-color: #ccc; /* 分隔条背景色 */
}
  
.right-panel {
    flex-grow: 1; /* 使右面板占据剩余空间 */
    display: flex; 
    flex-direction: column;
    border-left: 1px solid black; /* 添加左边框以分隔面板 */
    box-sizing: border-box; /* 包含内边距和边框在宽度内 */
}

.center-align {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tree-view-container {
    height: 100%;
    overflow-y: auto; /* 启用垂直滚动 */
    /* border: 1px solid #ccc;  */
}

.cls_view_node_tree {
    overflow-y: auto;
    box-sizing: border-box; /* 包含内边距和边框在宽度内 */
    display: flex;
    flex-direction: column; 
    border: 1px solid black;
}
</style>
