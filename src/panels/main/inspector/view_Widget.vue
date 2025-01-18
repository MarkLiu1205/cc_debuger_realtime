<script setup lang="ts">
import { reactive, ref } from 'vue';

const _compData = reactive({
    enabled: true,
    alignMode: 'ON_WINDOW',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    horizontalCenter: 0,
    verticalCenter: 0,
    isAlignLeft: false,
    isAlignRight: false,
    isAlignTop: false,
    isAlignBottom: false,
    isAlignHorizontalCenter: false,
    isAlignVerticalCenter: false,
});

const _tabVal_H = ref(0)
const _tabVal_V = ref(0)

function onToggle(event) {
    const id = event.target.id;
    const value = event.target.checked;

    switch (id) {
        case 'alignLeft':
            _compData.isAlignLeft = value;
            break;
        case 'alignRight':
            _compData.isAlignRight = value;
            break;
        case 'alignTop':
            _compData.isAlignTop = value;
            break;
        case 'alignBottom':
            _compData.isAlignBottom = value;
            break;
        case 'alignHorizontalCenter':
            _compData.isAlignHorizontalCenter = value;
            break;
        case 'alignVerticalCenter':
            _compData.isAlignVerticalCenter = value;
            break;
        default:
            break;
    }
}

function onTab(event){
    const id = event.target.id;
    const value = event.target.value;

    if(id=="id_h-align"){
        _tabVal_H.value = value
        if(value==0){
            _compData.isAlignLeft = false
            _compData.isAlignHorizontalCenter = false
            _compData.isAlignRight = false
            
        }else if(value==1){
            _compData.isAlignLeft = true
            _compData.isAlignHorizontalCenter = false
            _compData.isAlignRight = false
            
        }else if(value==2){
            _compData.isAlignLeft = false
            _compData.isAlignHorizontalCenter = true
            _compData.isAlignRight = false
        }else if(value==3){
            _compData.isAlignLeft = false
            _compData.isAlignHorizontalCenter = false
            _compData.isAlignRight = true
        }else if(value==4){
            _compData.isAlignLeft = true
            _compData.isAlignHorizontalCenter = false
            _compData.isAlignRight = true
        }
    }else if(id=="id_v-align"){
        _tabVal_V.value = value

        if(value==0){
            _compData.isAlignTop = false
            _compData.isAlignVerticalCenter = false
            _compData.isAlignBottom = false
            
        }else if(value==1){
            _compData.isAlignTop = true
            _compData.isAlignVerticalCenter = false
            _compData.isAlignBottom = false
            
        }else if(value==2){
            _compData.isAlignTop = false
            _compData.isAlignVerticalCenter = true
            _compData.isAlignBottom = false
        }else if(value==3){
            _compData.isAlignTop = false
            _compData.isAlignVerticalCenter = false
            _compData.isAlignBottom = true
        }else if(value==4){
            _compData.isAlignTop = true
            _compData.isAlignVerticalCenter = false
            _compData.isAlignBottom = true
        }
    }
    console.log(id,value,_tabVal_H.value)
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);

    switch (id) {
        case 'left':
            _compData.left = value;
            break;
        case 'right':
            _compData.right = value;
            break;
        case 'top':
            _compData.top = value;
            break;
        case 'bottom':
            _compData.bottom = value;
            break;
        case 'horizontalCenter':
            _compData.horizontalCenter = value;
            break;
        case 'verticalCenter':
            _compData.verticalCenter = value;
            break;
        default:
            break;
    }
}

function onSelectChange(event) {
    _compData.alignMode = event.target.value;
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="_compData.enabled" @change="(e) => (_compData.enabled = e.target.checked)"></ui-checkbox>
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
            <ui-num-input id="left" :value="_compData.left" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property" v-if="_tabVal_H==2">
            <label>H-Center:</label>
            <ui-num-input id="horizontalCenter" :value="_compData.horizontalCenter" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property" v-if="_tabVal_H==3||_tabVal_H==4">
            <label>Right:</label>
            <ui-num-input id="right" :value="_compData.right" @change="onNumChange"></ui-num-input>
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
            <ui-num-input id="top" :value="_compData.top" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property" v-if="_tabVal_V==2">
            <label>V-Center:</label>
            <ui-num-input id="verticalCenter" :value="_compData.verticalCenter" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property" v-if="_tabVal_V==3||_tabVal_V==4">
            <label>Bottom:</label>
            <ui-num-input id="bottom" :value="_compData.bottom" @change="onNumChange"></ui-num-input>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";



</style>
