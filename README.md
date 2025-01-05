# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## setup

```bash
npm install

npm run dev

npm run build
```

TODO

资源占用相关
1.按照bundle筛选、是否正在被使用筛选、输入框筛选
2.统计当前资源所占用内存
3.统计每个资源的引用计数
4.显示资源的依赖关系
5.分析有可能没有释放的资源（如当前场景没有使用到的资源，也不被处在缓存中的prefab引用）
6.分析可能存在的需要手动释放的资源（如检测到动态引用到的资源，但是其引用计数没有增加）

节点数相关
1.支持节点树inspactor
2.支持显示指定节点所占用资源
3.支持实时在运行时预览资源（常住节点）


其他
1.支持自动刷新
2.支持在多个在线的runtime中进行切换