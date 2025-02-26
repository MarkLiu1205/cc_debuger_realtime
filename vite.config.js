import { defineConfig } from 'vite'; // 确保引入 defineConfig
import { nodeExternals } from 'rollup-plugin-node-externals';
import vue from '@vitejs/plugin-vue';
import { cocosPanelConfig, cocosPanelCss } from '@cocos-fe/vite-plugin-cocos-panel';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { viteObfuscateFile } from 'vite-plugin-obfuscator'; // 导入正确的函数

export default defineConfig(({ mode }) => {
    const isDev = mode === 'development';

    return {
        build: {
            lib: {
                entry: {
                    browser: './src/browser/index.ts',
                    _utils: './src/tools/_utils.ts',
                    main_panel: './src/panels/main/main_panel.ts',
                    eval_panel: './src/panels/eval/eval_panel.ts',
                    log_panel: './src/panels/log/log_panel.ts',
                    dynamicTexture_panel: './src/panels/dynamicTexture/dynamicTexture_panel.ts',
                    localCache_panel: './src/panels/localCache/localCache_panel.ts',
                },
                formats: ['cjs'],
                fileName: (format, entryName) => `${entryName}.cjs`,
            },
            watch: isDev
                ? {
                      include: ['./src/**/*.js', './src/**/*.ts', './src/**/*.vue', './src/**/*.css'],
                  }
                : null,
            target: 'modules',
            minify: isDev ? false : "terser", // 使用 Terser 压缩
            terserOptions: {
                compress: true,
                mangle: true, // 混淆变量名
            },
        },
        plugins: [
            viteObfuscateFile({
                // 混淆选项
                compact: true, // 压缩代码
                controlFlowFlattening: true, // 控制流扁平化
                deadCodeInjection: true, // 注入无用代码
                stringArray: true, // 加密字符串
                order: 'post',  // 使用新的 order 配置
                handler: 'transform', // 使用新的 handler 配置
            }),
            vue({
                template: {
                    compilerOptions: {
                        isCustomElement: (tag) => tag.startsWith('ui-'),
                    },
                },
            }),
            nodeExternals({
                builtins: true, // 排除 node 的内置模块
                deps: false, // 将依赖打入 dist，发布的时候可以删除 node_modules
                devDeps: true,
                peerDeps: true,
                optDeps: true,
            }),
            cocosPanelConfig(),
            cocosPanelCss({
                transform: (css) => {
                    // element-plus 的全局变量是作用在 :root , 需要改成 :host
                    // 黑暗模式它是在 html 添加 dark 类名，我们应该在最外层的 #app 添加 class="dark"
                    return css.replaceAll(':root', ':host').replaceAll('html.dark', '#app.dark');
                },
            }),
            AutoImport({
                resolvers: [ElementPlusResolver()],
            }),
            Components({
                resolvers: [ElementPlusResolver()],
            }),
        ],
    };
});
