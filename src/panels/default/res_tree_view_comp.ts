import { ref, computed, defineComponent, h,onMounted,onUnmounted } from 'vue';
import { _pluginSocket } from '../../tools/plugin_socket';
import { _funcs } from '../../tools/_funcs';
import { context_select_menu_comp, createContextMenu } from './context_select_menu_comp';


const tree_item_component = defineComponent({
    name: 'tree_item_component',
    props: {
        model: Object,
        depth: {
            type: Number,
            default: 0,
        },
        selectedItem: Object,
    },
    setup(props, { emit }) {
        const isOpen = ref(false);
        const isFolder = computed(() => props.model.children && props.model.children.length);
        const rotation = computed(() => (isOpen.value ? 'rotate(0deg)' : 'rotate(-90deg)'));

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
        <tree_item_component
            v-for="model in model.children"
            :key="model.name"
            :model="model"
            :depth="depth + 1"
            :selectedItem="selectedItem"
            @update:selectedItem="$emit('update:selectedItem', $event)"
        ></tree_item_component>
        </ul>
    </li>
    `,
})

const search_bar_comp = defineComponent({
    name: 'search_bar_comp',
    components:{
        context_select_menu_comp,
    },
    props: {
        bundleNames:{
            type:Array,
            default:[]
        }
    },
    setup(props, { emit }) {
        const toggleMenu_1 = (event:MouseEvent) => {
            event.stopPropagation();

            const rect = (event.target as HTMLElement).getBoundingClientRect();

            createContextMenu(document,{
                menuPosition:{
                    top: rect.bottom,
                    left: rect.left,
                },
                titleStr:"按照bundle筛选",
                is_muti_select:true,
                menu_text_arr:props.bundleNames as any,
                onClose(){
                    
                },
                onSelect(selected){
                    emit('menu:selectedBundle', selected);
                }
            })
            
        };
        const toggleMenu_2 = (event:MouseEvent) => {
            event.stopPropagation();

            const rect = (event.target as HTMLElement).getBoundingClientRect();

            createContextMenu(document,{
                menuPosition:{
                    top: rect.bottom,
                    left: rect.left,
                },
                titleStr:"按照资源是否正在使用筛选",
                is_muti_select:true,
                menu_text_arr:["正在使用","没使用"],
                onClose(){
                    
                },
                onSelect(selected){
                    emit('menu:selectedUsege', selected);
                }
            })
            
        };

        return {
            toggleMenu_1,
            toggleMenu_2,
        };
    },
    methods:{
        
        handleRefresh(){
            this.$emit('btn:refresh');
        },
        
    },
    template: `
    <div style="display: flex; flex-direction: row; align-items: center; gap: 5px; padding: 5px; width: 100%;">
        <ui-button type="icon" style="flex-shrink: 0;" @click="toggleMenu_1">
            <ui-icon value="filter"></ui-icon>
        </ui-button>
        
        <ui-input placeholder="按名称筛选" style="flex-grow: 1;"></ui-input>
        <div style="display: flex; gap: 5px;">
            <ui-button type="icon" style="flex-shrink: 0; " @click="handleRefresh">
                <span style="font-size: 18px;">⇌</span>
            </ui-button>
        </div>
    </div>
    `,
})

export const res_tree_view_comp = defineComponent({
    name: 'res_tree_view_comp',
    components: {
        tree_item_component: tree_item_component,
        search_bar_comp: search_bar_comp,
    },
    // emits: ['update:selectedItem'],
    props: {
        treeData_assets: Object,
        treeData_internal: Object,
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
            return this.treeData_assets==null && this.treeData_internal==null;
        }
    },
    methods: {
        onSel(item) {
            if (this.selectedItem === item) {
                this.selectedItem = null
            } else {
                this.selectedItem = item
            }
            this.$emit('update:selectedItem', this.selectedItem);
        },
        onMenuSelectBundle(selectMenu){
            console.log("onMenuSelectBundle",selectMenu)
        },
        onMenuSelectUsege(selectMenu){
            console.log("onMenuSelectUsege",selectMenu)
        },
        onRefreshRes(){
            this.$emit("change2ListView")
        }
    },
    template: `
    <div class="tree-view-container">
        <search_bar_comp stype="boder-bottom: 1px solid black" 
            :bundleNames="bundleNames" 
            @menu:selectedBundle="onMenuSelectBundle"
            @menu:selectedUsege="onMenuSelectUsege"
            @btn:refresh="onRefreshRes"
        />
        <tree_item_component class="item" v-if="treeData_assets!=null"
            :model="treeData_assets"
            :selectedItem="selectedItem"
            @update:selectedItem="onSel($event)"
        />
        <tree_item_component class="item" v-if="treeData_internal!=null"
            :model="treeData_internal"
            :selectedItem="selectedItem"
            @update:selectedItem="onSel($event)"
        />
    </div>
    `,
});