import fs from "fs-extra";
import path from "path";
import javascriptObfuscator from "javascript-obfuscator";
import { execSync } from "child_process";

// // TODO: 先使用 tsc 编译 cc_debuger_2.ts 再进行混淆
// const tsFilePath = './../runtime/cc_debuger_2.ts';
// const jsFilePath = './../runtime/cc_debuger_2.js';

// if (fs.existsSync(jsFilePath)) {
//     fs.removeSync(jsFilePath)
// }
// if (fs.existsSync(tsFilePath)) {
//     console.log(`Compiling TypeScript file: ${tsFilePath}`);
//     try {
//         execSync(`tsc ${tsFilePath} --outFile ${jsFilePath}`, { stdio: 'inherit' });
//         console.log(`Compiled: ${tsFilePath} -> ${jsFilePath}`);

        
//     } catch (error) {
//         // console.error(`TypeScript compilation failed: ${error.message}`);
//     }

//     if (fs.existsSync(jsFilePath)) {
//         const jsCode = fs.readFileSync(jsFilePath, 'utf-8');
//         const obfuscatedJsCode = javascriptObfuscator.obfuscate(jsCode, {
//             compact: true,
//             controlFlowFlattening: true,
//             deadCodeInjection: true,
//             stringArray: true,
//             rotateStringArray: true,
//             stringArrayEncoding: ['base64'],
//             stringArrayThreshold: 0.75,
//         }).getObfuscatedCode();

//         fs.writeFileSync(jsFilePath, obfuscatedJsCode, 'utf-8');
//         console.log(`Obfuscated: ${jsFilePath}\n`);
//     }
// }

// 混淆 `server_original.js` 文件
const serverFilePath = './../server/server_original.js';
const obfuscatedServerFilePath = './../server/server.js';

// 检查并混淆 `server_original.js` 文件
if (fs.existsSync(serverFilePath)) {
    const serverCode = fs.readFileSync(serverFilePath, 'utf-8');
    const obfuscatedServerCode = javascriptObfuscator.obfuscate(serverCode, {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        stringArray: true,
        rotateStringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
    }).getObfuscatedCode();

    fs.writeFileSync(obfuscatedServerFilePath, obfuscatedServerCode, 'utf-8');
    console.log(`Obfuscated: server_original.js -> server.js\n`);
}

// 指定要混淆的文件夹路径
const inputDir = './../dist'; // 这里假设编译后的文件在 `dist` 目录下
const outputDir = './../dist'; // 输出目录

// 需要忽略的文件列表
const ignoreFiles = ["_utils.cjs", "example.cjs"]; // 这里添加要忽略的文件名

// 创建输出目录
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// 获取目录中的所有文件并混淆 `.cjs` 文件
fs.readdirSync(inputDir).forEach((file) => {
    if (ignoreFiles.includes(file)) {
        console.log(`Skipping: ${file}`);
        return; // 跳过被忽略的文件
    }

    const filePath = path.join(inputDir, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isFile() && file.endsWith('.cjs')) {
        // 读取 .cjs 文件内容
        const code = fs.readFileSync(filePath, 'utf-8');
        
        // 对文件内容进行混淆
        const obfuscatedCode = javascriptObfuscator.obfuscate(code, {
            compact: true,
            controlFlowFlattening: true,
            deadCodeInjection: true,
            stringArray: true,
            rotateStringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.75,
        }).getObfuscatedCode();

        // 将混淆后的代码写入输出目录
        const outputFilePath = path.join(outputDir, file);
        fs.writeFileSync(outputFilePath, obfuscatedCode, 'utf-8');
        console.log(`Obfuscated: ${file}`);
    }
});

console.log('Obfuscation complete!');
