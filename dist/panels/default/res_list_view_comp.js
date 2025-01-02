"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.res_list_view_comp = void 0;
const vue_1 = require("vue");
exports.res_list_view_comp = (0, vue_1.defineComponent)({
    name: 'res_list_view_comp',
    components: {},
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
    computed: {},
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
    },
    template: `
    
    <div >
        <h3>这是个列表</h3>
    </div>
    `,
});
