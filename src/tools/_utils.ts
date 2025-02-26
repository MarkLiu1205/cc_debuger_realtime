const {PNG} = require('pngjs');
const fs = require('fs-extra');

export namespace _utils{
    export function base64ToUint8Array(base64String: string): Uint8Array {
        // 1. 使用 atob 将 Base64 解码为二进制字符串
        const binaryString = atob(base64String);
    
        // 2. 创建一个 Uint8Array 来存储结果
        const uint8Array = new Uint8Array(binaryString.length);
    
        // 3. 将二进制字符串的每个字符转换为 Uint8Array 中的字节
        for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
        }
    
        return uint8Array;
    }
    
    export function saveUnit8ArrayPng(uint8Array:Uint8Array,width:number,height:number,savePath:string){
        const channels = 4; // RGBA 通道数
    
        // 创建一个新的 PNG 对象
        const png = new PNG({
            width: width,
            height: height,
            colorType: 6, // 6 表示 RGBA
            inputColorType: 6, // 输入数据是 RGBA
            inputHasAlpha: true // 输入数据包含 Alpha 通道
        });
    
        // 将原始像素数据复制到 PNG 对象中
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (width * y + x) * channels;
                const pngIdx = (width * y + x) << 2;
    
                png.data[pngIdx] = uint8Array[idx]; // R
                png.data[pngIdx + 1] = uint8Array[idx + 1]; // G
                png.data[pngIdx + 2] = uint8Array[idx + 2]; // B
                png.data[pngIdx + 3] = uint8Array[idx + 3]; // A
            }
        }
    
        // 保存为 PNG 文件
        const buffer = PNG.sync.write(png);
        fs.writeFileSync(savePath, buffer);
        console.log('文件保存成功: ',savePath);
    }
}