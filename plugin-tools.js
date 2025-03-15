import fs from "fs-extra";
import path from "path";
import javascriptObfuscator from "javascript-obfuscator";
import { execSync } from "child_process";
import archiver from "archiver";

async function waitForTime(sec) {
    return await new Promise((resolve,reject)=>{
        setTimeout(() => {
            resolve(null)
        }, sec*1000);
    })
}

function deal_cc_debuger_2(){
    // TODO: 先使用 tsc 编译 cc_debuger_2.ts 再进行混淆
    const tsFilePath = 'runtime/cc_debuger_2.ts';
    const jsFilePath = 'runtime/cc_debuger_2_ugly.ts';

    if (fs.existsSync(jsFilePath)) {
        fs.removeSync(jsFilePath)
    }
    if (fs.existsSync(tsFilePath)) {
        console.log(`Compiling TypeScript file: ${tsFilePath}`);
        try {
            execSync(`tsc ${tsFilePath} --outFile ${jsFilePath}`, { stdio: 'inherit' });
            console.log(`Compiled: ${tsFilePath} -> ${jsFilePath}`);

            
        } catch (error) {
            // console.error(`TypeScript compilation failed: ${error.message}`);
        }

        if (fs.existsSync(jsFilePath)) {
            const jsCode = fs.readFileSync(jsFilePath, 'utf-8');
            const obfuscatedJsCode = javascriptObfuscator.obfuscate(jsCode, {
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                stringArray: true,
                rotateStringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75,
            }).getObfuscatedCode();

            const uglyJsCode = `const jsStr = \`${obfuscatedJsCode}\`\ntry{\n    const _func = new Function(jsStr)\n    _func()\n}catch(e){\n    console.log(e)\n}`
            fs.writeFileSync(jsFilePath, uglyJsCode, 'utf-8');
            console.log(`Obfuscated: ${jsFilePath}\n`);
        }
    }
}

function move_cc_debuger_2_ugly() {
    const fromPath = 'runtime/cc_debuger_2_ugly.ts';
    const toPath = '../../assets/cc_debuger_2_ugly.ts';

    // 检查目标路径是否存在
    if (fs.existsSync(toPath)) {
        console.log(`Target file ${toPath} exists. Overwriting...`);
        // 复制源文件到目标路径并进行覆盖
        fs.copyFileSync(fromPath, toPath);
        console.log(`Copied ${fromPath} to ${toPath}`);
    }
}

function deal_server_js(){
    // 混淆 `js_server_with_wasm.js` 文件
    const serverFilePath = 'server/js_server_with_wasm.js';
    const obfuscatedServerFilePath = 'server/server.js';

    if (fs.existsSync(serverFilePath)) {
        const serverCode = fs.readFileSync(serverFilePath, 'utf-8');
        const obfuscatedServerCode = javascriptObfuscator.obfuscate(serverCode, {
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: true,
            stringArray: true,
            rotateStringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.75,
        }).getObfuscatedCode();

        fs.writeFileSync(obfuscatedServerFilePath, obfuscatedServerCode, 'utf-8');
        console.log(`Obfuscated: server_original.js -> server.js\n`);
    }
}

function deal_dist(){
    // 指定要混淆的文件夹路径
    const inputDir = 'dist'; // 这里假设编译后的文件在 `dist` 目录下
    const outputDir = 'dist'; // 输出目录

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
                controlFlowFlattening: false,
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
}

/**打包成压缩包 */
function packPluginToZip() {
    const folders = [
        "dist/",
        "i18n/",
        "builder/",
        "runtime/cc_debuger_1.ts",
        "runtime/cc_debuger_2_ugly.ts",
        "server/server.wasm",
        "server/server.js",
        "server/wasm/",
        "package.json"
    ];

    let obj = JSON.parse(fs.readFileSync("package.json"));
    // console.log(obj.version)

    // 去掉 scripts 和 devDependencies 字段
    delete obj.scripts;
    delete obj.devDependencies;

    // 将修改后的内容写入一个临时文件
    const tempPackageJsonPath = "temp_package.json";
    fs.writeFileSync(tempPackageJsonPath, JSON.stringify(obj, null, 2), "utf-8");

    const archiveDir = 'archive';
    if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir);
    }

    const saveZipPath = `${archiveDir}/cc_debuger_realtime_${obj.version}(${obj.package_version}).zip`;

    const output = fs.createWriteStream(saveZipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // 设置压缩级别
    });

    output.on('close', function () {
        console.log(`${saveZipPath} has been finalized and the output file descriptor has closed. Total size: ${archive.pointer()} bytes`);
        // 删除临时文件
        fs.removeSync(tempPackageJsonPath);
    });

    output.on('end', function () {
        console.log('Data has been drained');
    });

    archive.on('warning', function (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
        console.warn(err);
    });

    archive.on('error', function (err) {
        throw err;
    });

    archive.pipe(output);

    folders.forEach((folder) => {
        if (fs.existsSync(folder)) {
            if (fs.statSync(folder).isDirectory()) {
                archive.directory(folder, folder);
            } else if (folder === "package.json") {
                // 使用修改后的临时文件替换原始的 package.json
                archive.file(tempPackageJsonPath, { name: "package.json" });
            } else {
                archive.file(folder, { name: folder });
            }
        } else {
            console.warn(`Warning: ${folder} does not exist and will not be included in the zip.`);
        }
    });

    archive.finalize();
}

function cleanNpmCacheSync() {
    try {
      // 定义要删除的文件和目录的路径
      const nodeModulesPath = "node_modules"
      const packageLockPath = "package-lock.json"
   
      // 检查并删除 node_modules 目录
      if (fs.existsSync(nodeModulesPath)) {
        console.log("Deleting node_modules directory...");
        fs.removeSync(nodeModulesPath);
        console.log("node_modules directory deleted.");
      } else {
        console.log("node_modules directory does not exist.");
      }
   
      // 检查并删除 package-lock.json 文件
      if (fs.existsSync(packageLockPath)) {
        console.log("Deleting package-lock.json file...");
        fs.removeSync(packageLockPath);
        console.log("package-lock.json file deleted.");
      } else {
        console.log("package-lock.json file does not exist.");
      }
    } catch (error) {
      console.error("An error occurred while cleaning the project:", error);
    }
}

// 修改 buildServer 函数
function buildServer() {
    const buildBatDir = "server"
    try {
        execSync(`cd ${buildBatDir} && build.bat`, { stdio: 'inherit', shell: true });
    } catch (err) {
        console.error(`Failed to execute build script: ${err.message}`);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
console.log("param",args);
 
const firstArg = args[0];
if(firstArg=="isClear"){
    cleanNpmCacheSync()
}else{
    buildServer()

    await waitForTime(1)
    deal_cc_debuger_2()

    await waitForTime(1)
    deal_dist()

    await waitForTime(1)
    packPluginToZip()

    deal_server_js()

    console.log('Obfuscation complete!');
    move_cc_debuger_2_ugly()
}