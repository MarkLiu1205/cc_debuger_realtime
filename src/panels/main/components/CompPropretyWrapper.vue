<script setup lang=ts>
import { ref, reactive, onUnmounted, watch, nextTick, defineExpose,defineProps, onMounted, computed } from 'vue';

import comp_component_selecter from '../components/comp_component_selecter.vue';
import comp_node_selecter from '../components/comp_node_selecter.vue';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _funcs } from '../../../tools/_funcs';

const pModel = defineModel<any>()

interface _AttrType{
    type:string,
    ctor?:string,
    min?:number,
    max?:number,
    step?:number,
    range?:number[],
    tooltip?:string,
    slide?:boolean,
    multiline?:boolean,
    enumList?:Array<{name:string,value:number}>,
    displayName?:string,
    displayOrder?:number
}

const props = defineProps<{
    attrs: _AttrType,
    propretyName:string
}>()

function onSelect(event){
    const sel = parseInt(event.target.value)
    
    pModel.value[props.propretyName] = sel
}

function onSliderChange(event) {
    const value = event.target.value
    pModel.value[props.propretyName] = value

    console.log(value,typeof value)
}

function onNumChange(event,sub?:string) {
    let value = parseFloat(event.target.value);
    if(Number.isInteger(props?.attrs?.step)){
        value = parseInt(event.target.value);
    }
    if(sub){
        pModel.value[props.propretyName][sub] = value
    }else{
        pModel.value[props.propretyName] = value
    }
}

function onTextChange(event){
    const val = event.target.value
    pModel.value[props.propretyName] = val
}

function onToggle(event){
    const bool = event.target.value
    pModel.value[props.propretyName] = bool
}

function onConfirmColor(event){
    const [r,g,b,a] = event.target.value
    
    pModel.value[props.propretyName] = _funcs.rgbaToHex(r,g,b,a)
}

function onAssetChange(event){
    const val = event.target.value
    pModel.value[props.propretyName] = val
}

onMounted(()=>{
    console.log("ssss",pModel)
})

</script>

<template>
    <div class="property">
        <label>{{attrs?.displayName?? propretyName}}:</label>

        <comp_component_selecter class="comp_component_selecter" v-model="pModel[propretyName]" :compType="attrs.ctor" v-if="attrs.type=='cc.Component'"/>
        <comp_node_selecter class="comp_node_selecter" v-model="pModel[propretyName]" v-else-if="attrs.type=='cc.Node'"/>
        <comp_selecter_asset :assetType="attrs.ctor"  v-model="pModel[propretyName]" v-else-if="attrs.type=='cc.Asset'"/>
        <ui-color :value="pModel[propretyName]" @confirm="onConfirmColor" v-else-if="attrs.type=='cc.Color'" />

        <div class="vectorInput"  v-else-if="attrs.type=='cc.Vec2'||attrs.type=='cc.Vec3'||attrs.type=='cc.Vec4'||attrs.type=='cc.Rect'">
            <ui-num-input class="shortInput" @change="onNumChange($event,'x')" :value="pModel[propretyName].x"  step="0.01" unit="x"></ui-num-input>
            <ui-num-input class="shortInput" @change="onNumChange($event,'y')":value="pModel[propretyName].y"  step="0.01" unit="y"></ui-num-input>
        </div>

        <div class="vectorInput"  v-else-if="attrs.type=='cc.Size'">
            <ui-num-input class="shortInput" @change="onNumChange($event,'width')" :value="pModel[propretyName].width"  step="0.01" unit="width"></ui-num-input>
            <ui-num-input class="shortInput" @change="onNumChange($event,'height')":value="pModel[propretyName].height"  step="0.01" unit="height"></ui-num-input>
        </div>

        <ui-select :value="pModel[propretyName]" @change="onSelect" v-else-if="attrs.type=='Enum'">
            <option v-for="(mode, index) in attrs.enumList" :key="mode.value" :value="mode.value">{{ mode.name }}</option>
        </ui-select>
        <ui-slider :value="pModel[propretyName]" @change="onSliderChange" :step="attrs.step??0.01" :min="attrs.min??0" :max="attrs.max??1" v-else-if="attrs.slide"/>
        <ui-num-input :value="pModel[propretyName]" @change="onNumChange" :step="attrs.step??0.01" :min="attrs.min??null" :max="attrs.max??null" v-else-if="attrs.type=='number'"/>
        <ui-textarea :value="pModel[propretyName]" @change="onTextChange" v-else-if="attrs.type=='string'&&attrs.multiline" />
        <ui-input :value="pModel[propretyName]" @change="onTextChange" v-else-if="attrs.type=='string'" />
        <ui-checkbox :value="pModel[propretyName]" @change="onToggle" v-else-if="attrs.type=='boolean'" />
        
    </div>
    <div class="property" style="margin-top: 5px;" v-if="attrs.type=='cc.Vec3'||attrs.type=='cc.Vec4'">
        <label></label>
        <div class="vectorInput">
            <ui-num-input class="shortInput" @change="onNumChange($event,'z')" :value="pModel[propretyName].x"  step="0.01" unit="z"></ui-num-input>
            <ui-num-input class="shortInput" @change="onNumChange($event,'w')" :value="pModel[propretyName].y"  step="0.01" unit="w" v-if="attrs.type=='cc.Vec4'"></ui-num-input>
        </div>
    </div>
    <div class="property" style="margin-top: 5px;" v-if="attrs.type=='cc.Rect'">
        <label></label>
        <div class="vectorInput">
            <ui-num-input class="shortInput" @change="onNumChange($event,'width')" :value="pModel[propretyName].width"  step="0.01" unit="width"></ui-num-input>
            <ui-num-input class="shortInput" @change="onNumChange($event,'height')":value="pModel[propretyName].height"  step="0.01" unit="height"></ui-num-input>
        </div>
    </div>
</template>

<style scoped>
@import "../inspector/inspector.css";

.property {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.verticalVector {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.shortInput {
    width: 90px;
}

.vectorInput {
    display: flex;
    flex-direction: row;
    gap: 10px;
}

</style>