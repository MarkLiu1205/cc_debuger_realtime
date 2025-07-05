<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import CompPropretyWrapper from '../components/CompPropretyWrapper.vue';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';
import { _funcs } from '../../../tools/_funcs';

const props = defineProps({
    compAttrs:{
        type:Object,
        default:null
    }
})
const compModel = defineModel<CompInfo_Base>()

let scriptAssect = ref<EditorAssetInfo>(null)

async function checkIdCustomScript(){
    if(compModel.value.clsId==compModel.value.typeStr){
        return null
    } 
    let uuid = Editor.Utils.UUID.decompressUUID(compModel.value.clsId);
    
    scriptAssect.value = await _funcs.getAssetInfoByUuid(uuid)
    if(scriptAssect.value==null){
        uuid = compModel.value.clsId
        scriptAssect.value = await _funcs.getAssetInfoByUuid(uuid)
        if(scriptAssect.value==null){
            return null
        }
    }
    console.log("获取到的脚本信息",scriptAssect)
}

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.checked;
    if (eleId === "id_enabled") {
        compModel.value.enabled = value;
    }
}

onMounted(()=>{
    // console.log("compAttrs",props.compAttrs)
    checkIdCustomScript()
})

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>{{ compModel.typeStr }}</h3>
        </div>
        <div v-if="scriptAssect!=null" class="property">
            <label>Script:</label>
            <ui-asset droppable="cc.Script" disabled :value="scriptAssect.uuid"></ui-asset>
        </div>
        <div v-if="compAttrs!=null" v-for="(attrs, propretyName) in compAttrs" :key="propretyName" >
            <CompPropretyWrapper v-model="compModel" :attrs="attrs" :propretyName="propretyName"></CompPropretyWrapper>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
