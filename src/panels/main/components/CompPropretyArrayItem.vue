<script setup lang="ts">
import { ref, computed, inject, Ref, watch, defineModel, onMounted } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _dataCtx } from '../../../tools/_dataCtx';
import { eventBus } from '../../../tools/_enentBus';
import comp_node_selecter from '../components/comp_node_selecter.vue';
import CompPropretyWrapper from '../components/CompPropretyWrapper.vue';

interface _AttrType{
    type:string,
    ctor?:string,
    ctorBase?:string,
    propretyName?:string,
}

const props = defineProps<{
    attrs: _AttrType,
    arrItemVal:any,
    idx:number
}>()

const newModel = ref({
    [props.attrs.propretyName]:props.arrItemVal
})

const newAttr = ref({
    type:props.attrs.ctorBase??props.attrs.ctor,
    ctor:props.attrs.ctor,
    isArray:true,
})


</script>

<template>
    <div class="row">
        <label class="index">[{{ idx }}]</label>
         <CompPropretyWrapper v-model="newModel" :attrs="newAttr" :propretyName="attrs.propretyName"></CompPropretyWrapper>
    </div>
</template>

<style scoped>
@import "../inspector/inspector.css";

.row {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.index {
    margin-left: 20px;
}

</style>
