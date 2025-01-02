import { ref, computed, defineComponent, h } from 'vue';

export const res_list_view_comp = defineComponent({
    name: 'res_list_view_comp',
    components: {
        
    },
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
        
    },
    template: `
    
    <div >
        <h3>这是个列表</h3>
    </div>
    `,
});