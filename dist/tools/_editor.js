"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._editor = void 0;
var _editor;
(function (_editor) {
    /**
     * 获取资源信息
     * @param {string} uuid
     * @returns {Promise<any>}
     */
    async function getAssetInfoByUuid(uuid) {
        return Editor.Message.request('asset-db', 'query-asset-info', uuid);
    }
    _editor.getAssetInfoByUuid = getAssetInfoByUuid;
    /**
     * 获取资源url
     * @param {string} uuid
     * @returns {Promise<any>}
     */
    async function getAssetUrlByUuid(uuid) {
        return Editor.Message.request('asset-db', 'query-url', uuid);
    }
    _editor.getAssetUrlByUuid = getAssetUrlByUuid;
    /**
     * 获取资源 META
     * @param {string} uuidOrurl
     * @returns {Promise<any>}
     */
    async function getAssetMetaByUuid(uuidOrurl) {
        return Editor.Message.request('asset-db', 'query-asset-meta', uuidOrurl);
    }
    _editor.getAssetMetaByUuid = getAssetMetaByUuid;
    /**
     * 获取资源绝对路径
     * @param {string} uuidOrUrl
     * @returns {Promise<string>}
     */
    async function getPathByUUidUrl(uuidOrUrl) {
        return Editor.Message.request('asset-db', 'query-path', uuidOrUrl);
    }
    _editor.getPathByUUidUrl = getPathByUUidUrl;
    /**
     * 获取资源 uuid
     * @param {string} url
     * @returns {Promise<string>}
     */
    async function getUuidByUrl(url) {
        return Editor.Message.request('asset-db', 'query-uuid', url);
    }
    _editor.getUuidByUrl = getUuidByUrl;
})(_editor = exports._editor || (exports._editor = {}));
