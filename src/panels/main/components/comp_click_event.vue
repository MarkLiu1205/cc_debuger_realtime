<script setup lang="ts">
import { ref, computed, inject, Ref, watch, defineModel, onMounted } from 'vue';
import comp_node_selecter from '../components/comp_node_selecter.vue';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _dataCtx } from '../../../tools/_dataCtx';
import { eventBus } from '../../../tools/_enentBus';
import { _funcs } from '../../../tools/_funcs';

const pModel = defineModel<{
    node:string,
    comp:string,
    handler:string
}>()

const props = defineProps<{
    disabled?:boolean
}>()

const compName = ref("")
const scriptAssetId = ref("")

onMounted(async ()=>{
    const targetNode = await _pluginSocket.getNodeInfo(pModel.value.node)

    let obj = targetNode?.components?.find(a=>(a.uuid==pModel.value.comp||a.clsId==pModel.value.comp));
    if(obj){
        if(obj.clsId==obj.typeStr){
            compName.value = obj.clsId.replace("cc.","")
        }else{
            let uuid = Editor.Utils.UUID.decompressUUID(obj.clsId);
        
            let info = await _funcs.getAssetInfoByUuid(uuid)
            if(info==null){
                uuid = obj.clsId
                info = await _funcs.getAssetInfoByUuid(uuid)
                if(info==null){
                    compName.value = ""
                }
            }
            if(info){
                scriptAssetId.value = info.uuid
            }
            compName.value = info.name
        }
    }
})

</script>

<template>
    <div>
        <div class="node-comp">
            <comp_node_selecter class="wisth140" v-model="pModel.node" :disabled="true"/>
            <ui-asset class="wisth140" droppable="cc.Script" disabled :value="scriptAssetId"></ui-asset>
        </div>
        <label class="bold">{{ pModel.handler }}</label>
    </div>
</template>

<style scoped>

.node-comp{
    display: flex;
    flex-direction: row;
    align-items: center;
}

.wisth140{
    width: 140px;
}

.bold{
    font-style: bold;
    font-size: 14px;
}

</style>
