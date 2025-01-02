export namespace _editor{

export interface AssetInfo {
    url:string,
    type:string,
    uuid:string,
    path:string,
}

/**
 * 获取资源信息
 * @param {string} uuid 
 * @returns {Promise<any>} 
 */
export async function getAssetInfoByUuid(uuid):Promise<AssetInfo> {
    return Editor.Message.request('asset-db', 'query-asset-info', uuid);
}

/**
 * 获取资源url
 * @param {string} uuid 
 * @returns {Promise<any>} 
 */
export async function getAssetUrlByUuid(uuid) {
    return Editor.Message.request('asset-db', 'query-url', uuid);
}

/**
 * 获取资源 META
 * @param {string} uuidOrurl 
 * @returns {Promise<any>} 
 */
export async function getAssetMetaByUuid(uuidOrurl) {
    return Editor.Message.request('asset-db', 'query-asset-meta', uuidOrurl);
}

/**
 * 获取资源绝对路径
 * @param {string} uuidOrUrl 
 * @returns {Promise<string>} 
 */
export async function getPathByUUidUrl(uuidOrUrl) {
    return Editor.Message.request('asset-db', 'query-path', uuidOrUrl);
}

/**
 * 获取资源 uuid
 * @param {string} url 
 * @returns {Promise<string>} 
 */
export async function getUuidByUrl(url) {
    return Editor.Message.request('asset-db', 'query-uuid', url);
}

}