<script setup lang="ts">
import { _funcs } from '../../tools/_funcs';
import TestFlow from '../main/components/TestFlow.vue';

async function test_1() {
    console.log('test_1');
    
    let ret = await Editor.Message.request(_funcs.getPluginName(),"doEvalJs","return '12345ggg'")
    console.log("ret:",ret)
}
function test_2() {
    console.log('test_2');
}
</script>

<template>
    <!-- <div style="width: 600px;height: 600px;">
        
    </div> -->
    <div style="width: 100vw; height: 100vh; ">  
        <div style="border: 2px solid red; width: calc(100% - 10px);height: calc(100% - 35px);">
            <ui-button style="width: 100px;height: 40px; margin: 10px;" @click="test_1">测试1</ui-button>
            <ui-button style="width: 100px;height: 40px; margin: 10px;" @click="test_2">测试2</ui-button>
            <TestFlow/>
        </div>
    </div>
</template>

<style scoped>

</style>
