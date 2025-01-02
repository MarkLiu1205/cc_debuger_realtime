"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = require("vue");
const server_socket_1 = require("../../tools/server_socket");
const res_tree_view_comp_1 = require("./res_tree_view_comp");
const _dataCtx_1 = require("../../tools/_dataCtx");
const plugin_socket_1 = require("../../tools/plugin_socket");
// @ts-ignore
const package_json_1 = __importDefault(require("../../../package.json"));
const _misc_1 = require("../../tools/_misc");
const panelDataMap = new WeakMap();
const main_app_comp = (0, vue_1.defineComponent)({
    name: 'MainApp',
    components: {
        res_tree_view_comp: res_tree_view_comp_1.res_tree_view_comp,
    },
    props: {},
    setup(props, ctx) {
        const treeData = (0, vue_1.reactive)({
            treeData_assets: null,
            treeData_internal: null,
            isRuntimeOffline: true,
            runtimePreviewUrl: _misc_1._misc.getRuntimePreviewUrl(),
            bundleNames: _dataCtx_1._dataCtx.m_bundleNames,
        });
        plugin_socket_1._pluginSocket.getNewAddedAssets().then((uuidMap) => {
            console.log("全部列表", typeof uuidMap, uuidMap);
            _dataCtx_1._dataCtx.mark_using_uuids(uuidMap).then(() => {
                treeData.treeData_assets = _dataCtx_1._dataCtx.treeData_assets;
                treeData.treeData_internal = _dataCtx_1._dataCtx.treeData_internal;
                treeData.bundleNames = _dataCtx_1._dataCtx.m_bundleNames;
            });
        });
        plugin_socket_1._pluginSocket.listenRuntimeOnlineInfo((bIsOnline) => {
            _misc_1._misc.log_1("runtime在线吗?", bIsOnline);
            treeData.isRuntimeOffline = !bIsOnline;
        });
        plugin_socket_1._pluginSocket.listenRuntimeList((nameArr) => {
            _misc_1._misc.log_1("runtime 列表：", JSON.stringify(nameArr));
        });
        plugin_socket_1._pluginSocket.listenSceneNodeTree((data) => {
            _misc_1._misc.log_1("节点树变化：");
        });
        const width_asset_list = (0, vue_1.ref)(_misc_1._misc.clamp(200, 500, window.innerWidth * 0.3)); // 默认左面板宽度占窗口宽度的30%
        const width_node_tree = (0, vue_1.ref)(_misc_1._misc.clamp(200, 500, window.innerWidth * 0.3)); // 默认左面板宽度占窗口宽度的30%
        const resizer_ele_1 = (0, vue_1.ref)(null); //拉伸左右边界的线
        const resizer_ele_2 = (0, vue_1.ref)(null); //拉伸左右边界的线
        const onMouseDown = (e) => {
            const width_ref = e.target == resizer_ele_1.value ? width_asset_list : width_node_tree;
            const startX = e.clientX;
            const startWidth = width_ref.value;
            const onMouseMove = (moveEvent) => {
                const newWidth = startWidth + (moveEvent.clientX - startX);
                // 限制最小和最大宽度
                width_ref.value = _misc_1._misc.clamp(200, 500, newWidth);
            };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        (0, vue_1.onMounted)(() => {
            plugin_socket_1._pluginSocket.waitForRuntimeIsInline().then(() => {
                _misc_1._misc.waitForElementMounted(resizer_ele_1).then(() => {
                    resizer_ele_1.value.addEventListener('mousedown', onMouseDown);
                });
                _misc_1._misc.waitForElementMounted(resizer_ele_2).then(() => {
                    resizer_ele_2.value.addEventListener('mousedown', onMouseDown);
                });
            });
        });
        (0, vue_1.onUnmounted)(() => {
            if (resizer_ele_1.value) {
                resizer_ele_1.value.removeEventListener('mousedown', onMouseDown);
            }
            if (resizer_ele_2.value) {
                resizer_ele_2.value.removeEventListener('mousedown', onMouseDown);
            }
        });
        return {
            treeData,
            width_asset_list,
            width_node_tree,
            resizer_ele_1,
            resizer_ele_2,
        };
    },
    computed: {
        isLoading_res() {
            return this.treeData.treeData_assets == null && this.treeData.treeData_internal == null;
        }
    },
    methods: {
        onSel(item) {
            console.log('选中:', item);
        },
        doOpenRuntimePreview() {
            _misc_1._misc.openWebSiteUrl(this.treeData.runtimePreviewUrl);
        },
        doReOpenSelfPopup() {
            Editor.Message.send(package_json_1.default.name, "restart-self");
        },
        onChange2ListView() {
            console.log("切换list 1");
            let obj = "";
            for (let i = 0; i < 1024 * 10; i++) {
                obj += (i % 9) + "";
            }
            plugin_socket_1._pluginSocket._sendPush("test", obj);
        },
        onChange2TreeView() {
            console.log("切换tree");
        }
    },
    template: `
    <div>
        <div class="loading-div" style="flex-direction: column;" v-if="treeData.isRuntimeOffline">
            <h2>没有检测到可用运行时</h2>
            <p>推荐打开预览：{{treeData.runtimePreviewUrl}}</p>
            <ui-button type="default"  @confirm="doOpenRuntimePreview">点击打开预览 {{treeData.runtimePreviewUrl}}</ui-button>
        </div>
        <div id="eid_view_main" class="cls_view_main" v-else>
            <div id="eid_view_asset_list" class="cls_view_asset_list" :style="{ width: width_asset_list + 'px' }">
                <div class="loading-div" v-if="isLoading_res">
                    <ui-loading></ui-loading>
                </div>
                <res_tree_view_comp id="eid_view_res_tree" v-else
                    :treeData_assets="treeData.treeData_assets"
                    :treeData_internal="treeData.treeData_internal"
                    :isRuntimeOffline="treeData.isRuntimeOffline"
                    :runtimePreviewUrl="treeData.runtimePreviewUrl"
                    :bundleNames="treeData.bundleNames"
                    @update:selectedItem="onSel($event)"
                    @change2ListView="onChange2ListView"
                />
                <div style="height:50px">
                    <ui-button type="icon" style="flex-shrink: 0; " @click="doReOpenSelfPopup">
                        <ui-icon value="refresh" style="font-size: 16px;" />
                    </ui-button>
                </div>
            </div>
            <div class="resizer-line-1" ref="resizer_ele_1"></div>
            <div id="eid_view_node_tree" class="cls_view_node_tree" :style="{ width: width_node_tree + 'px' }">
                <div class="loading-div" v-if="isLoading_res">
                    <ui-loading></ui-loading>
                </div>

                <div class="tree-view-container">
                    <span>灌灌灌灌灌</span>
                </div>
                
                <div style="height:50px">
                    
                </div>
            </div>
            <div class="resizer-line-1" ref="resizer_ele_2"></div>
            <div class="right-panel">
                <h2 id="text-1" style="text-align: center;">哈哈哈哈哈哈2</h2>
                
            </div>
        </div>
    </div>
    `,
});
module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log('show');
        },
        hide() {
            console.log('hide');
        },
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(_misc_1._misc.getCurPluginPath(), 'static/template/default/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(_misc_1._misc.getCurPluginPath(), 'static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
    },
    methods: {
        hello() {
            console.log('[cocos-panel-html.default]: hello');
        }
    },
    async ready() {
        if (this.$.app) {
            const app = (0, vue_1.createApp)({
                render() {
                    return (0, vue_1.h)(main_app_comp);
                },
            });
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
        let debugPort = 8085;
        server_socket_1._serverSocket.start(`${debugPort}`);
        await plugin_socket_1._pluginSocket.connectToServer(`ws://localhost:${debugPort}`);
        window.addEventListener('keypress', this.onKeyPress);
    },
    beforeClose() {
        window.removeEventListener('keypress', this.onKeyPress);
    },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
        server_socket_1._serverSocket.stop();
        _misc_1._misc.stopSpawnProcess();
    },
});
