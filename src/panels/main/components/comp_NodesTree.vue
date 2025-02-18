<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps, nextTick, watch, Ref} from 'vue';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps,Tree } from 'element-plus/es/components/tree-v2/src/types';
import ContextMenu from './ContextMenu.vue';
import { eventBus } from '../../../tools/_enentBus';

const props = defineProps({
    height_nodeTree: {
        type: Number,
        
    }
})


const emit = defineEmits([
    'onSel_node',
])

const treeProp_node:TreeOptionProps = {
  value: 'key',
  label: 'name',
  children: 'children',
}

const nodeTree_datas = ref<Array<NodeTreeItem>>([]);

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
    // _funcs.log_1("节点树变化：",JSON.stringify(data,null,2))
    if(data){
        _updateNodeTreeKeys(data)
        _dataCtx.curNodeTreeInfo = data
        nodeTree_datas.value = [_dataCtx.curNodeTreeInfo]
    }
})

const _curSelNodeInfo = ref<InspectorInfo_Node>(null)

async function onSel_node(item:NodeTreeItem){
    if(item==null){
        _curSelNodeInfo.value = null
        emit('onSel_node', null);
        return null
    }
    
    let newVal = await _pluginSocket.getNodeInfo(item.uuid)
    // console.log(newVal)
    _dataCtx.parseCompAttrInfos(newVal)
    _curSelNodeInfo.value = newVal
    _dataCtx.setCurSelectNodeInfo(JSON.parse(JSON.stringify(newVal)))

    emit('onSel_node', newVal);
    return newVal
}

watch(_curSelNodeInfo, (newVal,old) => {
    if(old==null){
        return
    }
    if(newVal==null){
        return
    }
    
    const oldVal = _dataCtx.curSelNodeInspectorInfo;
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
        }
    }
    
    for(let i=0;i<newVal.components.length;i++){
        let newComp = newVal.components[i]
        let oldComp = oldVal.components[i];
        
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
            }
            
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
    // console.log("节点改变",JSON.stringify(_obj))
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

const ref_container_nodeTree = ref(null);
const ref_nodeTree = ref(null);


function handleClickOutside(event) {
    if(_funcs.checkMouseIsInElemen(ref_container_nodeTree.value, event)){
        if(_curSelNodeInfo.value){
            _curSelNodeInfo.value = null
            ref_nodeTree.value.setCurrentKey(null)   
            nextTick(() => {
                ref_nodeTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
            });
            
            onSel_node(null)
        }
    }
}

onMounted(() => {

    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {

    document.removeEventListener('click', handleClickOutside)
});

function on_click_in_inspector_node(uuid: string) {
    const info = _dataCtx.getTreeNodeInfoWithUuid(uuid);
    const key = info ? info["key"] : null;

    if (!key) return;
    shakeTreeItem(key); // 触发抖动动画
    const tree = ref_nodeTree.value;
    if (!tree) return;
    const nodeItem = tree.getNode(key);
    if (!nodeItem) {
        console.warn("节点未找到:", key);
        return;
    }
    // console.log("目标节点:", nodeItem);
    // 递归展开所有父节点
    let parent = nodeItem.parent;
    while (parent) {
        tree.expandNode(parent, true); // 确保父级被展开
        parent = parent.parent;
    }
    // 滚动到目标节点
    nextTick(() => {
        tree.scrollToNode(nodeItem);
    });
}

async function on_click_in_inspector_component(uuid: string){
    const {uuid:nodeUuid} = await _pluginSocket.getNodeOfComp(uuid)
    on_click_in_inspector_node(nodeUuid)
}

onMounted(() => {
    eventBus.on("click-node-in-inspector", on_click_in_inspector_node);
    eventBus.on("click-component-in-inspector", on_click_in_inspector_component);
});

onUnmounted(() => {
    eventBus.off("click-node-in-inspector", on_click_in_inspector_node);
    eventBus.off("click-component-in-inspector", on_click_in_inspector_component);
});

const customClass_Node = (nodeData): string => {
  return nodeData.uuid === _curSelNodeInfo.value?.uuid ? 'custom-current' : ''
}
async function onClick_node (data: NodeTreeItem, node: TreeNode, e: MouseEvent){
    if(_curSelNodeInfo.value?.uuid == data.uuid){
        if(ref_nodeTree.value){            
            _curSelNodeInfo.value = null
            ref_nodeTree.value.setCurrentKey(null)   
            nextTick(() => {
                ref_nodeTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
            });
            
            onSel_node(null)
        }
    }else{

        onSel_node(data)
    }

}

const contextMenuRef = ref(null);

/**右键点击节点项 */
function onRightClick_node( event: MouseEvent, data: NodeTreeItem, node: TreeNode) {
    ref_nodeTree.value.setCurrentKey(node.key)   
    
    _curSelNodeInfo.value = null
    onClick_node(data,node,event)

    const menuOptions_node = [
        { 
            label: '查看资源依赖', 
            action: () => {
                console.log("点击1")
            }
        },{ 
            label: '删除此节点', 
            action: () => {
                console.log("点击2")
            }
        }
    ];
    nextTick(()=>{
        contextMenuRef.value.showContextMenu(event, menuOptions_node);
    })
}

const shakingNodeKey = ref<string | null>(null);

function shakeTreeItem(nodeKey: string) {
    shakingNodeKey.value = nodeKey;

    // 动画持续 1.2s，之后清除高亮状态
    setTimeout(() => {
        shakingNodeKey.value = null;
    }, 0.8*1000);
}

function onDrop(data: TreeNodeData, node: TreeNode, e: DragEvent){
    console.log(data)
}
</script>

<template>
    <div ref="ref_container_nodeTree"  :style="{ height: height_nodeTree + 'px'}">
        <div class="loading-div" v-if="nodeTree_datas.length==0">
            <ui-loading></ui-loading>
            <span style="margin-left: 10px;">正在加载节点树</span>
        </div>
        <el-tree-v2 v-else ref="ref_nodeTree"
            :data="nodeTree_datas"
            :props="{...treeProp_node,class: customClass_Node}"
            :height="props.height_nodeTree"
            @node-click="onClick_node"
            :highlight-current="true"
            :expand-on-click-node="false"
            @node-contextmenu="onRightClick_node"
            @node-drop="onDrop"
        >
            <template #default="{ node }">
                <ui-label 
                    class="nodeItem" 
                    :class="{ 'shake-animation': shakingNodeKey === node.data.key, noActive: !node.data.activeInHierarchy }"
                >
                    {{ node.label }}
                </ui-label>
            </template>
        </el-tree-v2>
    </div>
    
    <ContextMenu ref="contextMenuRef" />
</template>

<style scoped>

.loading-div {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

:deep(.el-tree-node__content) {
    cursor: default !important;
}

/* 自定义高亮背景和文字颜色 */
:deep(.custom-current) > .el-tree-node__content {
    background-color: #227F9B !important; /* 金黄色背景 */
    color: #ffffff !important; /* 白色文字 */
}

/* 修改 hover 状态下的背景色 */
:deep(.el-tree-node__content:hover) {
    background-color: #525252 !important; /* 橙色背景 */
    color: #ffffff !important; /* 白色文字 */
}

/* 当前节点 hover 状态下应用高亮 */
:deep(.custom-current:hover) > .el-tree-node__content {
    background-color: #227F9B !important; /* 高亮背景色 */
    color: #ffffff !important; /* 文字颜色 */
}

.nodeItem{
    color: #EDEDED;
}

.nodeItem.noActive{
    color: #929292;
}

@keyframes shakeEffect {
    0% { transform: scale(1) rotate(0deg); color: #C68D4B; }
    10% { transform: scale(1.1) rotate(-5deg); }
    20% { transform: scale(1.1) rotate(5deg); }
    30% { transform: scale(1.1) rotate(-5deg); }
    40% { transform: scale(1.1) rotate(5deg); }
    50% { transform: scale(1.1) rotate(-5deg); }
    60% { transform: scale(1.1) rotate(0deg); }
    100% { transform: scale(1) rotate(0deg); color: inherit; }
}

.shake-animation {
    animation: shakeEffect 0.8s ease-in-out;
}


</style>
