<script setup lang="ts">
import { reactive, ref } from 'vue';

enum AlignMode {
    ONCE = 0,
    ALWAYS = 1,
    ON_WINDOW_RESIZE = 2
}

const enumDesc_AlignMode = ["ONCE", "ALWAYS", "ON_WINDOW_RESIZE"];


// const compModel = reactive({
//     enabled: true,
//     alignMode: AlignMode.ON_WINDOW_RESIZE,
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//     horizontalCenter: 0,
//     verticalCenter: 0,
//     isAlignLeft: false,
//     isAlignRight: false,
//     isAlignTop: false,
//     isAlignBottom: false,
//     isAlignHorizontalCenter: false,
//     isAlignVerticalCenter: false,
// });

const compModel = defineModel<CompInfo_Widget>()

const _tabVal_H = ref(0)
const _tabVal_V = ref(0)

function onTab(event){
    const id = event.target.id;
    const value = event.target.value;

    if(id=="id_h-align"){
        _tabVal_H.value = value
        if(value==0){
            compModel.value.isAlignLeft = false
            compModel.value.isAlignHorizontalCenter = false
            compModel.value.isAlignRight = false
            
        }else if(value==1){
            compModel.value.isAlignLeft = true
            compModel.value.isAlignHorizontalCenter = false
            compModel.value.isAlignRight = false
            
        }else if(value==2){
            compModel.value.isAlignLeft = false
            compModel.value.isAlignHorizontalCenter = true
            compModel.value.isAlignRight = false
        }else if(value==3){
            compModel.value.isAlignLeft = false
            compModel.value.isAlignHorizontalCenter = false
            compModel.value.isAlignRight = true
        }else if(value==4){
            compModel.value.isAlignLeft = true
            compModel.value.isAlignHorizontalCenter = false
            compModel.value.isAlignRight = true
        }
    }else if(id=="id_v-align"){
        _tabVal_V.value = value

        if(value==0){
            compModel.value.isAlignTop = false
            compModel.value.isAlignVerticalCenter = false
            compModel.value.isAlignBottom = false
            
        }else if(value==1){
            compModel.value.isAlignTop = true
            compModel.value.isAlignVerticalCenter = false
            compModel.value.isAlignBottom = false
            
        }else if(value==2){
            compModel.value.isAlignTop = false
            compModel.value.isAlignVerticalCenter = true
            compModel.value.isAlignBottom = false
        }else if(value==3){
            compModel.value.isAlignTop = false
            compModel.value.isAlignVerticalCenter = false
            compModel.value.isAlignBottom = true
        }else if(value==4){
            compModel.value.isAlignTop = true
            compModel.value.isAlignVerticalCenter = false
            compModel.value.isAlignBottom = true
        }
    }
    console.log(id,value,_tabVal_H.value)
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);

    switch (id) {
        case 'left':
            compModel.value.left = value;
            break;
        case 'right':
            compModel.value.right = value;
            break;
        case 'top':
            compModel.value.top = value;
            break;
        case 'bottom':
            compModel.value.bottom = value;
            break;
        case 'horizontalCenter':
            compModel.value.horizontalCenter = value;
            break;
        case 'verticalCenter':
            compModel.value.verticalCenter = value;
            break;
        default:
            break;
    }
}

function onSelectChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if(id=="id_alignMode"){
        compModel.value.alignMode = value;
    }
    
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="compModel.enabled" @change="(e) => (compModel.enabled = e.target.checked)"></ui-checkbox>
            <h3>Widget</h3>
        </div>
        <div class="property">
            <label>H-Alignment:</label>
            <div class="property">
                <ui-tab @change="onTab" id="id_h-align" :value="_tabVal_H">
                    <ui-button>None</ui-button>
                    <ui-button><ui-icon value="align-left"></ui-icon></ui-button>
                    <ui-button><ui-icon value="align-h-center"></ui-icon></ui-button>
                    <ui-button><ui-icon value="align-right"></ui-icon></ui-button>
                    <ui-button>Stretch</ui-button>
                </ui-tab>
            </div>
        </div>
        <div class="property" v-if="_tabVal_H==1||_tabVal_H==4">
            <label>Left:</label>
            <ui-num-input id="left" :value="compModel.left" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property" v-if="_tabVal_H==2">
            <label>H-Center:</label>
            <ui-num-input id="horizontalCenter" :value="compModel.horizontalCenter" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property" v-if="_tabVal_H==3||_tabVal_H==4">
            <label>Right:</label>
            <ui-num-input id="right" :value="compModel.right" @change="onNumChange"></ui-num-input>
        </div>

        <div class="property">
            <label>V-Alignment:</label>
            <div class="property">
                <ui-tab @change="onTab" id="id_v-align" :value="_tabVal_V">
                    <ui-button>None</ui-button>
                    <ui-button><ui-icon value="align-top"></ui-icon></ui-button>
                    <ui-button><ui-icon value="align-v-center"></ui-icon></ui-button>
                    <ui-button><ui-icon value="align-bottom"></ui-icon></ui-button>
                    <ui-button>Stretch</ui-button>
                </ui-tab>
            </div>
        </div>
        <div class="property" v-if="_tabVal_V==1||_tabVal_V==4">
            <label>Top:</label>
            <ui-num-input id="top" :value="compModel.top" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property" v-if="_tabVal_V==2">
            <label>V-Center:</label>
            <ui-num-input id="verticalCenter" :value="compModel.verticalCenter" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property" v-if="_tabVal_V==3||_tabVal_V==4">
            <label>Bottom:</label>
            <ui-num-input id="bottom" :value="compModel.bottom" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Animation Cache Mode:</label>
            <ui-select id="id_alignMode" v-model="compModel.alignMode" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_AlignMode" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";



</style>
