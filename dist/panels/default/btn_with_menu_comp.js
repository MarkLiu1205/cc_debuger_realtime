"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.btn_with_menu_comp = void 0;
const vue_1 = require("vue");
const context_select_menu_comp_1 = require("./context_select_menu_comp");
exports.btn_with_menu_comp = (0, vue_1.defineComponent)({
    name: 'btn_with_menu_comp',
    components: {
        context_select_menu_comp: context_select_menu_comp_1.context_select_menu_comp
    },
    props: {
        menu_text_arr: Array,
        is_muti_select: {
            type: Boolean,
            default: false,
        },
        titleStr: {
            type: String,
            default: null
        }
    },
    setup(props, { emit }) {
        const toggleMenu = (event) => {
            event.stopPropagation();
            const rect = event.target.getBoundingClientRect();
            (0, context_select_menu_comp_1.createContextMenu)(document, {
                menuPosition: {
                    top: rect.bottom,
                    left: rect.left,
                },
                titleStr: props.titleStr,
                is_muti_select: props.is_muti_select,
                menu_text_arr: props.menu_text_arr,
                onClose() {
                },
                onSelect(selected) {
                    emit('select', selected);
                }
            });
        };
        const onSel = (xxx) => {
            console.log("xxxx", xxx);
        };
        return {
            toggleMenu,
            onSel,
        };
    },
    template: `
    <div >
        <slot name="button" :toggleMenu="toggleMenu"></slot>

    </div>
    `,
});
