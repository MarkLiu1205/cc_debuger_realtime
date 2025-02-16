
<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';

const bShow = ref(false)
const isLoading = ref(false)

let items = ref<any[]>([]);

_pluginSocket.listenProfileInfo((arr)=>{
    items.value = arr
})

onMounted(()=>{
    _pluginSocket.requestShowFPS().then((bool:boolean)=>{
        console.log("bool",bool,typeof bool)
        bShow.value = bool
    })
})

function onToggle(event){
    const bool = event.target.value
    console.log("bool",bool)
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
            <ui-checkbox @change="onToggle" :value="bShow"><h3>显示FPS</h3></ui-checkbox>
        </div>
        <div v-if="bShow" class="item" v-for="item in items" :key="item.desc">
            <span>{{ item.desc }}</span>
            <span style="flex: 1;text-align: right;">{{ item.value }}</span>
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
    margin-top: 15px;
    margin-bottom: 15px;
    margin-left: 5px;
    gap: 20px;
}

.item {
    display: flex;
    justify-content: center;
    margin: 3px;
}
</style>
