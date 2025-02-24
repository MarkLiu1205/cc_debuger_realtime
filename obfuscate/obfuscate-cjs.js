import fs from "fs-extra";
import path from "path";
import javascriptObfuscator from "javascript-obfuscator";

// 指定要混淆的文件夹路径
const inputDir = './../dist'; // 这里假设编译后的文件在 `dist` 目录下
const outputDir = './../dist'; // 输出目录

// 混淆 `server_original.js` 文件
const serverFilePath = './../server/server_original.js'
const obfuscatedServerFilePath = './../server/server.js'

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
    console.log(`Obfuscated: server_original.js -> server.js`);
}

// 创建输出目录
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// 获取目录中的所有文件并混淆 `.cjs` 文件
fs.readdirSync(inputDir).forEach((file) => {
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
