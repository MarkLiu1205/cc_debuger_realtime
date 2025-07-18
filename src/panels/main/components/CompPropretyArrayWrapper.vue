<script setup lang="ts">
import { ref, computed, inject, Ref, watch, defineModel, onMounted } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _funcs } from '../../../tools/_funcs';
import CompPropretyArrayItem from '../components/CompPropretyArrayItem.vue';

const pModel = defineModel<any>()

interface _AttrType{
    type:string,
    ctor?:string,
    displayName?:string,

    ctorBase?:string,
}

const props = defineProps<{
    attrs: _AttrType,
    propretyName:string
}>()

const isExpand = ref(false)
function onExpandArr(){
    isExpand.value = !isExpand.value;
}

</script>

<template>
    <div v-if="attrs.type=='Array'" >
        <div class="property" @click="onExpandArr">
            <div style="width: 105px;">
                <ui-icon color value="arrow-right" style="font-size: 10px;" :class="{ expanded: isExpand,unexpanded: !isExpand }"/>
                <label>{{attrs?.displayName?? _funcs.capitalizeSplit(propretyName)}}:</label>
            </div>
            
            <ui-num-input disabled :value="pModel[propretyName].length"  />
        </div>
        <div class="arrRect" v-if="isExpand">
            <div class="arr-item" v-for="(arrItem,k) in pModel[propretyName]" :key="k">
                <CompPropretyArrayItem :arrItemVal="pModel[propretyName][k]" :idx="k" :attrs="attrs" :propretyName="propretyName"/>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "../inspector/inspector.css";

.expanded {
    transition: transform 0.2s;
    transform: rotate(90deg);
}
.unexpanded {
    transition: transform 0.2s;
    transform: rotate(0deg);
}

.arrRect {
    border: 1px dashed #ccc;
    width: 100%;
    margin-top: 5px;
}

.property {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.arr-item{
    margin-top: 10px;
    margin-bottom: 10px;
    gap: 10px;
}

</style>
