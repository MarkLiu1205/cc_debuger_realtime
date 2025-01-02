"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.res_tree_comp = void 0;
const vue_1 = require("vue");
const _misc_1 = require("../../tools/_misc");
const tree_item_component = (0, vue_1.defineComponent)({
    name: 'TreeItem',
    props: {
        model: Object,
        depth: {
            type: Number,
            default: 0,
        },
        selectedItem: Object,
    },
    setup(props, { emit }) {
        const isOpen = (0, vue_1.ref)(false);
        const isFolder = (0, vue_1.computed)(() => props.model.children && props.model.children.length);
        const rotation = (0, vue_1.computed)(() => (isOpen.value ? 'rotate(0deg)' : 'rotate(-90deg)'));
        function onExpand() {
            isOpen.value = !isOpen.value;
        }
        function onSelectItem() {
            emit('update:selectedItem', props.model);
        }
        return {
            isOpen,
            isFolder,
            onExpand,
            onSelectItem,
            rotation,
        };
    },
    template: `
    <li>
        <div
        :class="[{ bold: isFolder, selected: selectedItem === model }, 'item']"
        @click="onSelectItem"
        @dblclick="onExpand"
        :style="{ '--depth': depth }">
        <span class="toggle-button" @click.stop="onExpand" v-if="isFolder">
            <ui-icon value="arrow-triangle" style="font-size: 14px;" 
            :style="{ transform: rotation }"></ui-icon>
        </span>
        <span>
            <ui-icon color="red" :value="model.icon"></ui-icon>
        </span>
        {{ model.name }}
        </div>
        <ul v-show="isOpen" v-if="isFolder">
        <tree-item
            v-for="model in model.children"
            :key="model.name"
            :model="model"
            :depth="depth + 1"
            :selectedItem="selectedItem"
            @update:selectedItem="$emit('update:selectedItem', $event)"
        ></tree-item>
        </ul>
    </li>
    `,
});
exports.res_tree_comp = (0, vue_1.defineComponent)({
    name: 'TreeView',
    components: {
        TreeItem: tree_item_component,
    },
    // emits: ['update:selectedItem'],
    props: {
        treeData_assets: Object,
        treeData_internal: Object,
        isRuntimeOffline: Boolean,
        runtimePreviewUrl: String,
        bundleNames: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            selectedItem: null,
        };
    },
    computed: {
        isLoading() {
            return this.treeData_assets == null && this.treeData_internal == null;
        }
    },
    methods: {
        onSel(item) {
            if (this.selectedItem === item) {
                this.selectedItem = null;
            }
            else {
                this.selectedItem = item;
            }
            this.$emit('update:selectedItem', this.selectedItem);
        },
        doOpenRuntimePreview() {
            _misc_1._misc.openWebSiteUrl(this.runtimePreviewUrl);
        }
    },
    template: `
    <div class="loading-div" style="flex-direction: column;" v-if="isRuntimeOffline">
        <h3>预览没有打开</h3>
        <p>{{runtimePreviewUrl}}</p>
        <ui-button type="default"  @confirm="doOpenRuntimePreview">打开运行时预览{{runtimePreviewUrl}}</ui-button>
    </div>
    <div class="loading-div" v-else-if="isLoading">
        <ui-loading></ui-loading>
    </div>
    <div class="tree-view-container" v-else>
        <tree-item class="item" v-if="treeData_assets!=null"
        :model="treeData_assets"
        :selectedItem="selectedItem"
        @update:selectedItem="onSel($event)">
        </tree-item>
        <tree-item class="item" v-if="treeData_internal!=null"
        :model="treeData_internal"
        :selectedItem="selectedItem"
        @update:selectedItem="onSel($event)">
        </tree-item>
    </div>
    `,
});
