"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._pluginSocket = void 0;
const _funcs_1 = require("./_funcs");
let _accId = 0;
function _getAccId() {
    return ++_accId;
}
class PluginSocket {
    constructor() {
        this._onOpenResolve = [];
        this._spiltMsg = {};
        /**存储推送过来的，需要存储的数据，如在线列表、当前节点树 */
        this._on_push_dataMap = {};
        this._onChangeForPushData = {};
        this._onWaitRuntimeOnlineResolves = [];
        this.m_socket = null;
        this.m_pendingRequests = new Map();
    }
    closeSocket() {
        if (this.m_socket) {
            this.m_socket.close();
            this.m_socket = null;
        }
    }
    _checkIsConnect() {
        if (this.m_socket && this.m_socket.readyState === WebSocket.OPEN) {
            return true;
        }
        return false;
    }
    async connectToServer(url) {
        this.closeSocket();
        await new Promise((resolve, reject) => {
            this.m_socket = new WebSocket(url);
            this.m_socket.onopen = () => {
                _funcs_1._funcs.log_1(' Connected to server');
                this._send({ type: 'identify', role: 'plugin' });
                resolve(null);
            };
            this.m_socket.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                this._onMessage(msg);
            };
            this.m_socket.onclose = () => {
                _funcs_1._funcs.log_1(' Disconnected from server');
            };
            this.m_socket.onerror = (error) => {
                console.error('[Plugin] WebSocket error:', error);
                reject(error);
            };
        });
        this._onOpenResolve.forEach((resolve) => {
            resolve(null);
        });
        this._onOpenResolve = [];
    }
    /**等待socket连接上 */
    async waitSocketOpen() {
        if (this._checkIsConnect()) {
            return;
        }
        return new Promise((resolve, reject) => {
            this._onOpenResolve.push(resolve);
        });
    }
    _onMessage(msg) {
        // _funcs.log_1("onMesage",JSON.stringify(msg))
        if (msg["isSplit"]) {
            const obj = msg;
            this._spiltMsg[obj.uniqueId] = this._spiltMsg[obj.uniqueId] || [];
            this._spiltMsg[obj.uniqueId].push(obj);
            if (this._spiltMsg[obj.uniqueId].length === obj.total) {
                this._spiltMsg[obj.uniqueId].sort((a, b) => {
                    return a.idx - b.idx;
                });
                let str = "";
                for (let item of this._spiltMsg[obj.uniqueId]) {
                    str += item.data;
                }
                delete this._spiltMsg[obj.uniqueId];
                msg = JSON.parse(str);
            }
            else {
                return;
            }
        }
        if (msg.type === 'response' && msg.requestId != null) { //表示这条是对之前自己发送的请求的回复
            const pending = this.m_pendingRequests.get(msg.requestId);
            if (pending) {
                this.m_pendingRequests.delete(msg.requestId);
                pending.resolve(msg.data);
            }
        }
        else if (msg.type === 'push') {
            this._on_push_dataMap[msg.action] = msg.data;
            if (this._onChangeForPushData[msg.action]) { //表示注册过了监听
                this._onChangeForPushData[msg.action](msg.data);
            }
            if (msg.action === PushAction.otherSideOnlineChange) {
                let bIsOnline = msg.data;
                if (bIsOnline) {
                    if (this._onWaitRuntimeOnlineResolves) {
                        for (let resolve of this._onWaitRuntimeOnlineResolves) {
                            resolve(true);
                        }
                        this._onWaitRuntimeOnlineResolves = [];
                    }
                }
            }
        }
    }
    listenForPushData(pushAction, callback, defaultData = null) {
        var _a;
        this._onChangeForPushData[pushAction] = callback;
        const data = (_a = this._on_push_dataMap[pushAction]) !== null && _a !== void 0 ? _a : defaultData;
        if (callback) {
            callback(data);
        }
    }
    /**
     * 监听运行时的在线情况
     */
    listenRuntimeOnlineInfo(callback) {
        this.listenForPushData(PushAction.otherSideOnlineChange, callback, this._checkIsConnect());
    }
    /**
     * 监听所有在线runtime列表名称
     */
    listenRuntimeList(callback) {
        this.listenForPushData(PushAction.pushRuntimeList, callback, []);
    }
    /**
     * 监听节点树的变化
     */
    listenSceneNodeTree(callback) {
        this.listenForPushData(PushAction.updateSceneTree, callback, null);
    }
    /**等待runtime上线连接上plugin */
    async waitForRuntimeIsInline() {
        await this.waitSocketOpen();
        return new Promise(async (resolve, reject) => {
            let ret = await this._sendRequest('checkOtherSideIsInline');
            if (ret) {
                resolve(true);
            }
            else {
                this._onWaitRuntimeOnlineResolves.push(resolve);
            }
        });
    }
    /**选择一个runtime socket作为当前活跃的runtime */
    selectActiveRuntime(name) {
        this._sendPush("selectActiveRuntime", name);
    }
    _send(data) {
        var _a, _b;
        const step = 1024 * 10;
        const jsonStr = JSON.stringify(data);
        if (jsonStr.length <= step) {
            (_a = this.m_socket) === null || _a === void 0 ? void 0 : _a.send(jsonStr);
        }
        else {
            let idx = 0;
            const total = Math.ceil(jsonStr.length / step);
            const uniqueId = _getAccId();
            while (idx < total) {
                const subStr = jsonStr.substring(idx * step, Math.min((idx + 1) * step, jsonStr.length));
                const subObj = {
                    isSplit: true, idx: idx + 1, total: total, data: subStr, uniqueId: uniqueId,
                };
                (_b = this.m_socket) === null || _b === void 0 ? void 0 : _b.send(JSON.stringify(subObj));
                idx += 1;
            }
        }
    }
    /**
     * 发送一条不需要返回的socket推送
     */
    _sendPush(action, data = null) {
        if (!this.m_socket || this.m_socket.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error('WebSocket is not connected'));
        }
        this._send({ type: 'push', action: action, data: data });
    }
    /**发送一个需要返回的socket请求，异步返回结果 */
    async _sendRequest(action, data = null, type = 'request') {
        if (!this.m_socket || this.m_socket.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error('WebSocket is not connected'));
        }
        const requestId = _getAccId();
        const payload = { type: type, action, data, requestId };
        // _funcs.log_1(" send",JSON.stringify(payload))
        return new Promise((resolve, reject) => {
            this.m_pendingRequests.set(requestId, { resolve, reject });
            this._send(payload);
            // 超时处理
            setTimeout(() => {
                if (this.m_pendingRequests.has(requestId)) {
                    this.m_pendingRequests.delete(requestId);
                    reject(new Error(`Request timed out:  ${JSON.stringify(payload)}`));
                }
            }, 5000); // 5 秒超时
        });
    }
    async getNewAddedAssets() {
        await this.waitForRuntimeIsInline(); //要先等plugin和runtime都连上服务器
        let ret = await this._sendRequest('getNewAddedAssets');
        return ret;
    }
    async getRefCount(uuid) {
        await this.waitForRuntimeIsInline(); //要先等plugin和runtime都连上服务器
        return this._sendRequest('getRefCount', { uuid });
    }
    async getNodeInfo(uuid) {
        await this.waitForRuntimeIsInline(); //要先等plugin和runtime都连上服务器
        return this._sendRequest('getNodeInfo', { uuid });
    }
}
;
var PushAction;
(function (PushAction) {
    /**实时通知当前active runtime的在线情况 */
    PushAction["otherSideOnlineChange"] = "otherSideOnlineChange";
    /**实时更新当前在线的runtime列表 */
    PushAction["pushRuntimeList"] = "pushRuntimeList";
    /**实时刷新节点树 */
    PushAction["updateSceneTree"] = "updateSceneTree";
})(PushAction || (PushAction = {}));
exports._pluginSocket = new PluginSocket();
