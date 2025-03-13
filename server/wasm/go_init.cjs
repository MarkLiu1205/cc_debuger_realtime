// Copyright 2021 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// "use strict";

globalThis.require = require;
globalThis.fs = require("fs");
globalThis.TextEncoder = require("util").TextEncoder;
globalThis.TextDecoder = require("util").TextDecoder;

globalThis.performance = {
  now() {
    const [sec, nsec] = process.hrtime();
    return sec * 1000 + nsec / 1000000;
  },
};

const crypto = require("crypto");
const path = require("path")
globalThis.crypto = {
  getRandomValues(b) {
    crypto.randomFillSync(b);
  },
};


require("./wasm_exec.cjs");

// 加载Go编写的wasm文件
async function loadWasmOfGo(wasmPath) {
  const go = new Go();
  go.argv = [wasmPath];
  go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);
  go.exit = process.exit;
  const { instance } = await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname, wasmPath)), go.importObject);

  // 执行 Go WebAssembly 实例
  go.run(instance)
}

module.exports = {loadWasmOfGo}
// 使用方式 
//import {loadWasmOfGo} from './go_init.cjs';