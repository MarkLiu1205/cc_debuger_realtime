# Project Title

An extension that shows how to open and communicate with the panel through messages and menus.
The panel is based on Vue3.x.

## Development Environment

Node.js

## Install

```bash
# Install dependent modules
npm install
# build
npm run build
```

## Usage

After enabling the extension, click `Panel -> cc_debuger_realtime -> Default Panel` in the main menu bar to open the default panel of the extension.

To send a message to the default panel, click `Developer -> cc_debuger_realtime -> Send Message to Panel` at the top of the menu. If the default panel exists, the `hello` method of the panel will be called.

After clicking `Send Message to Panel`, a message `send-to-panel` will be sent to the extension as defined by `contributions.menu` in `package.json`. When the extension receives the `send-to-panel` message, it will cause the `default` panel to call the `hello` method as defined by `contributions.messages` in `package.json`.



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