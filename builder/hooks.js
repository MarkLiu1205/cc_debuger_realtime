"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterMake = exports.onBeforeMake = exports.onError = exports.unload = exports.onAfterBuild = exports.onAfterCompressSettings = exports.onBeforeCompressSettings = exports.onBeforeBuild = exports.load = exports.throwError = void 0;
let Fs = require('fs');
let Path = require('path');
let allAssets = [];
exports.throwError = true;
const load = function () {
    return __awaiter(this, void 0, void 0, function* () {
        allAssets = yield Editor.Message.request('asset-db', 'query-assets');
    });
};
exports.load = load;
const onBeforeBuild = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
    });
};
exports.onBeforeBuild = onBeforeBuild;
const onBeforeCompressSettings = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
    });
};
exports.onBeforeCompressSettings = onBeforeCompressSettings;
const onAfterCompressSettings = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
    });
};
exports.onAfterCompressSettings = onAfterCompressSettings;
const onAfterBuild = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.warn(`result.dest:${result.dest}`)//D:\myproject\cocos-demos\res_debuger_demo\build\web-desktop
        const index_js_path = result.dest + "/index.js";
        let str = Fs.readFileSync(index_js_path);
        // console.warn(`str:${str}`)
        str = log_intercept_str + "\n" + str;
        Fs.writeFileSync(index_js_path, str);
    });
};
exports.onAfterBuild = onAfterBuild;
const log_intercept_str = `window["cc_debuger_intercept_log"] = function(){
  if(!window["cc_debuger_log_intercepted"]){
    window["cc_debuger_log_intercepted"] = true;
    ["log", "warn", "error"].forEach(level => {
      const originalMethod = console[level];

      console[level] = (...args) => {
        if(window["cc_debuger_handleLog"]){
            window["cc_debuger_handleLog"](level, args);
        }
        return originalMethod.apply(console, args);
      };
    });
  }
}
window["cc_debuger_intercept_log"]()
`;
const unload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        // console.warn(`[${PACKAGE_NAME}] Unload cocos plugin example in builder.`);
    });
};
exports.unload = unload;
const onError = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo some thing
        // console.warn(`${PACKAGE_NAME} run onError`);
    });
};
exports.onError = onError;
const onBeforeMake = function (root, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.warn(`onBeforeMake: root: ${root}, options: ${options}`);
    });
};
exports.onBeforeMake = onBeforeMake;
const onAfterMake = function (root, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.warn(`onAfterMake: root: ${root}, options: ${options}`);
    });
};
exports.onAfterMake = onAfterMake;
