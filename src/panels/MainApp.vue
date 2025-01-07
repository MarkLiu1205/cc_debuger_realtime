<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
import TestFlow from './components/TestFlow.vue';
import ResListView from './components/ResListView.vue';
import { computed, inject, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { _funcs } from '../tools/_funcs';
import { _dataCtx } from '../tools/_dataCtx';
import { _pluginSocket } from '../tools/plugin_socket';

const treeData = reactive({
    treeData_assets: null,
    treeData_internal: null,
    isRuntimeOffline: true,
    runtimePreviewUrl: _funcs.getRuntimePreviewUrl(),
    bundleNames:_dataCtx.m_bundleNames,
});

_pluginSocket.getNewAddedAssets().then((uuidMap:Record<string,number>)=>{
    console.log("全部列表",typeof uuidMap,uuidMap)
    _dataCtx.mark_using_uuids(uuidMap).then(() => {
        treeData.treeData_assets = _dataCtx.treeData_assets;
        treeData.treeData_internal = _dataCtx.treeData_internal;
        treeData.bundleNames = _dataCtx.m_bundleNames;
    })
})

_pluginSocket.listenRuntimeOnlineInfo((bIsOnline)=>{
    _funcs.log_1("runtime在线吗?",bIsOnline)
    treeData.isRuntimeOffline = !bIsOnline
})

_pluginSocket.listenRuntimeList((nameArr)=>{
    _funcs.log_1("runtime 列表：",JSON.stringify(nameArr))
})

_pluginSocket.listenSceneNodeTree((data)=>{
    _funcs.log_1("节点树变化：")
})

const width_asset_list = ref(_funcs.clamp(200,500,window.innerWidth * 0.3)); // 默认左面板宽度占窗口宽度的30%
const width_node_tree = ref(_funcs.clamp(200,500,window.innerWidth * 0.3)); // 默认左面板宽度占窗口宽度的30%
const resizer_ele_1 = ref(null); //拉伸左右边界的线
const resizer_ele_2 = ref(null); //拉伸左右边界的线
const isLoading_res = computed(()=>{
    return treeData.treeData_assets==null && treeData.treeData_internal==null;
})

const onMouseDown = (e:MouseEvent) => {
    const width_ref = e.target==resizer_ele_1.value?width_asset_list:width_node_tree
    
    const startX = e.clientX
    const startWidth = width_ref.value

    const onMouseMove = (moveEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX)
        // 限制最小和最大宽度
        width_ref.value = _funcs.clamp(200,500,newWidth)
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
    
})

onUnmounted(() => {
    if (resizer_ele_1.value) {
        resizer_ele_1.value.removeEventListener('mousedown', onMouseDown)
    }
    if (resizer_ele_2.value) {
        resizer_ele_2.value.removeEventListener('mousedown', onMouseDown)
    }
})  

function onSel(item) {
    console.log('选中:', item);
}

function doOpenRuntimePreview() {
    _funcs.openWebSiteUrl(treeData.runtimePreviewUrl)
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

</script>

<template>
    <!-- <div style="width: 600px;height: 600px;">
        <TestFlow/>
    </div> -->
    <div style="width: 100%; height: 100%; border: 2px solid #f40909;">  
        <div class="loading-div" style="flex-direction: column;" v-if="treeData.isRuntimeOffline">
            <h2>没有检测到可用运行时</h2>
            <p>推荐打开预览：{{treeData.runtimePreviewUrl}}</p>
            <ui-button type="default"  @confirm="doOpenRuntimePreview">点击打开预览 {{treeData.runtimePreviewUrl}}</ui-button>
        </div>
        <div id="eid_view_main" class="cls_view_main" v-else>
            <div id="eid_view_asset_list" class="cls_view_asset_list" :style="{ width: width_asset_list + 'px' }">
                <div class="loading-div" v-if="isLoading_res">
                    <ui-loading></ui-loading>
                </div>
                
                <ResListView v-else
                    :treeData_internal="treeData.treeData_internal"
                    :treeData_assets="treeData.treeData_assets"
                    :bundleNames="treeData.bundleNames"
                    @update:selectedItem="onSel($event)"
                ></ResListView>
            </div>
            <div class="resizer-line-1" ref="resizer_ele_1"></div>
            <div id="eid_view_node_tree" class="cls_view_node_tree" :style="{ width: width_node_tree + 'px' }">
                <div class="loading-div" v-if="isLoading_res">
                    <ui-loading></ui-loading>
                </div>

                <div class="tree-view-container">
                    <span>灌灌灌灌灌</span>
                </div>
                
                <div style="height:50px">
                    
                </div>
            </div>
            <div class="resizer-line-1" ref="resizer_ele_2"></div>
            <div class="right-panel">
                <h2 id="text-1" style="text-align: center;">哈哈哈哈哈哈2</h2>
                
            </div>
        </div>
    </div>
</template>

<style scoped>
.cls_view_main {
    display: flex;
    flex-direction: row;
    height: 100vh; /* 使容器高度占满视口高度 */
    overflow: hidden; /* 防止内容溢出 */
}

.cls_view_asset_list {
    padding: 10px;
    overflow-y: auto;
    box-sizing: border-box; /* 包含内边距和边框在宽度内 */
    display: flex;
    flex-direction: column; 
    gap: 5px; 
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
    padding: 10px;
    box-sizing: border-box; /* 包含内边距和边框在宽度内 */
}

.loading-div {
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tree-view-container {
    height: 100%;
    overflow-y: auto; /* 启用垂直滚动 */
    border: 1px solid #ccc; /* 可选：为容器添加边框以明确可视区域 */
    padding-right: 10px; /* 可选：添加右侧内边距以避免滚动条遮挡内容 */
}

.cls_view_node_tree {
    padding: 10px;
    overflow-y: auto;
    box-sizing: border-box; /* 包含内边距和边框在宽度内 */
    display: flex;
    flex-direction: column; 
    gap: 5px; 
    border: 1px solid black;
}
</style>
