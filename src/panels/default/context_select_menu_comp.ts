import { ref, computed, defineComponent, h, onMounted, onUnmounted, createApp } from 'vue';

const _styles = {
    wrapper:"position: relative; display: inline-block;",
    context_menu:  `color: black; position: fixed; background-color: white; border: 1px solid #ccc; 
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); z-index: 10000; padding: 10px; list-style: none;
white-space: nowrap; transition: transform 0.3s ease, opacity 0.3s ease; margin: 0; 
`,
    context_menu_ul:`padding: 0; margin: 0; list-style: none;`,
    context_menu_li:`display: flex; align-items: center; margin-bottom: 5px; `,
}

export const context_select_menu_comp = defineComponent({
    name: 'context_select_menu_comp',
    props: {
        menu_text_arr: Array,
        is_muti_select: {
            type: Boolean,
            default: false,
        },
        titleStr: {
            type: String,
            default: null,
        },
        position: {
            type: Object,
            default: () => ({ top: 0, left: 0 }),
        },
    },
    setup(props, { emit }) {
        const popuMenuRef = ref(null);
        const selectedOptions = ref([]);
        const bSelectAll = ref(false)
        const onToggleAll = () => {
            console.log("bSelectAll.value",bSelectAll.value)
            selectedOptions.value = bSelectAll.value
              ? props.menu_text_arr
              : []

              handleSelection()
          }

        const handleSelection = () => {
            emit(
                'select',
                props.is_muti_select ? [...selectedOptions.value] : selectedOptions.value
            );
        };

        const closeMenu = (e:MouseEvent) => {
            e.stopPropagation()
            if (popuMenuRef.value == null) {
                return;
            }
            const rect = popuMenuRef.value.getBoundingClientRect();
            const isContain = e.clientX > rect.x && e.clientX < (rect.x + rect.width) && e.clientY > rect.y && e.clientY < (rect.y + rect.height);
            
            if (!isContain) {
                emit('close');
            }
        };

        onMounted(() => {
            document.addEventListener('click', closeMenu,{capture:true});
        });

        onUnmounted(() => {
            document.removeEventListener('click', closeMenu,{capture:true});
        });

        return {
            popuMenuRef,
            selectedOptions,
            handleSelection,
            onToggleAll,
            bSelectAll
        };
    },
    template: `
    <div ref="popuMenuRef"
        style="${_styles.context_menu}"
        :style="{ top: position.top + 'px', left: position.left + 'px' }"
    >
        <span v-if="titleStr != null">{{ titleStr }}</span>
        <div style="margin-left: -5px;" v-if="is_muti_select">
            <input type="checkbox" id="checkbox-all" @change="onToggleAll" v-model="bSelectAll" />
            <label for="checkbox-all">全选</label>
        </div>
        <ul style="${_styles.context_menu_ul}">
            <li v-for="(text, index) in menu_text_arr" :key="index" style="${_styles.context_menu_li}">
                <input
                    type="checkbox"
                    v-if="is_muti_select"
                    v-model="selectedOptions"
                    :value="text"
                    :id="'sel_item-' + text"
                    @change="handleSelection"
                />
                <input
                    type="radio"
                    v-else
                    v-model="selectedOptions"
                    :value="text"
                    :id="'sel_item-' + text"
                    @change="handleSelection"
                />
                <label :for="'sel_item-' + text">{{ text }}</label>
            </li>
        </ul>
    </div>
    `,
});

export const createContextMenu = (document,props:{
    titleStr?:string,
    is_muti_select?:boolean,
    menu_text_arr:Array<String>,
    menuPosition:{left:number,top:number},

    onClose?:()=>void,
    onSelect:(selected)=>void,

}) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp({
        render() {
            return h(context_select_menu_comp, {
                menu_text_arr: props.menu_text_arr,
                is_muti_select: props.is_muti_select,
                titleStr: props.titleStr,
                position: props.menuPosition,
                onClose: () => {
                    app.unmount();
                    document.body.removeChild(container);
                    if(props.onClose){
                        props.onClose()
                    }
                    
                },
                onSelect: (selected) => {
                    if(props.onSelect){
                        props.onSelect(selected)
                    }
                },
            });
        },
    });

    app.mount(container);
};