<script setup lang="ts">
import { reactive } from 'vue';

// const _compData = reactive({
//     anchorPoint:{x:0.5,y:0.5},
//     contentSize:{width:100,height:100},
//     enabled:true,
// });

const compModel = defineModel<CompInfo_UITransform>()

function onNumChange(event){
    const num = event.target.value
    const eleId = event.target.id
    if(eleId=="anchorPoint.x"){
        compModel.value.anchorPoint.x = num
    }else if(eleId=="anchorPoint.y"){
        compModel.value.anchorPoint.y = num
    }else if(eleId=="contentSize.width"){
        compModel.value.contentSize.width = num
    }else if(eleId=="contentSize.height"){
        compModel.value.contentSize.height = num
    }
    // console.log("-----onchange",JSON.stringify(compModel.value))
}

function onToggle(event){
    compModel.value.enabled = event.target.value
    console.log("event.target.value",event.target.value,"id",event.target.id)
}

</script>

<template>
    <div class="component-properties" v-if="compModel!=null">
        <div class="title">
            <ui-checkbox id="id_enable" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>cc.UITransform</h3>
        </div>
        <div class="property">
            <label>anchorPoint:</label>
            <div class="vector-input">
                <ui-num-input id="anchorPoint.x" @change="onNumChange" :value="compModel.anchorPoint.x"  step="0.01" unit="x"></ui-num-input>
                <ui-num-input id="anchorPoint.y" @change="onNumChange":value="compModel.anchorPoint.y"  step="0.01" unit="y"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>contentSize:</label>
            <div class="vector-input">
                <ui-num-input id="contentSize.width" @change="onNumChange" :value="compModel.contentSize.width" placeholder="width"></ui-num-input>
                <ui-num-input id="contentSize.height" @change="onNumChange":value="compModel.contentSize.height" placeholder="height"></ui-num-input>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

label {
    width: 95px;
    /* display: inline-block; */
}

input[type="number"] {
    width: 80px;
}

ui-num-input {
    width: 90px;
}
</style>
