
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _funcs } from '../../../tools/_funcs';

const bShow = ref(false)
const isLoading = ref(false)

let items = ref<any[]>([]);


let _cancelFor_onProfileInfoChange:()=>void = null
let _cancelFor_onLoopFrameTimeChange:()=>void = null

onMounted(()=>{
    _cancelFor_onProfileInfoChange = _pluginSocket.listenProfileInfo((arr)=>{
        items.value = arr
    })

    _cancelFor_onLoopFrameTimeChange = _pluginSocket.listenLoopFrameTime((frameTime:number)=>{
        // if(frameTime>0){
            // console.log("frameTime",frameTime)
        // }
    })

    _pluginSocket.requestShowFPS().then((bool:boolean)=>{
        bShow.value = bool
    })
})

onUnmounted(()=>{
    if(_cancelFor_onProfileInfoChange){
        _cancelFor_onProfileInfoChange()
        _cancelFor_onProfileInfoChange = null;
    }
    if(_cancelFor_onLoopFrameTimeChange){
        _cancelFor_onLoopFrameTimeChange()
        _cancelFor_onLoopFrameTimeChange = null;
    }
})

function onToggle(event){
    const bool = event.target.value
    bShow.value = bool

    isLoading.value = true
    _pluginSocket.requestShowFPS(bool).then(()=>{
        isLoading.value = false
    })
}

</script>

<template>
    <div class="loading" v-if="isLoading">
        <ui-loading></ui-loading>
        <span style="margin-left: 10px;">loading...</span>
    </div>
    <div class="profiler" v-else>
        <div class="title">
            <ui-checkbox @change="onToggle" :value="bShow"><h3>{{ _funcs.getI18nText("text_47") }}</h3></ui-checkbox>
        </div>
        <div v-if="bShow" class="item" v-for="item in items" :key="item.desc">
            <span style="margin-left: 10px;">{{ item.desc }}</span>
            <span style="flex: 1;text-align: right;margin-right: 10px;">{{ item.value }}</span>
        </div>
    </div>
</template>

<style scoped>

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
}

.profiler{
    width: 100%;
    border: 1px solid rgb(165, 165, 165);
    font-size: 14px;
}

.title{
    display: flex;
    margin-top: 10px;
    margin-bottom: 5px;
    margin-left: 10px;
    gap: 20px;
}

.item {
    display: flex;
    justify-content: center;
    margin: 2px;
}
</style>
