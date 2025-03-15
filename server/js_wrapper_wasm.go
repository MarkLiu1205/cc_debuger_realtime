//go:build wasm
// +build wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

func handleConnectionWrapper(this js.Value, args []js.Value) interface{} {
	if len(args) < 4 {
		fmt_println("missing argument")
	}
	wsId := args[0].Int()
	ip := args[1].String()
	port := args[2].String()
	family := args[3].String()

	_server.OnRealConnection(wsId, ip, port, family)

	result := 0
	return js.ValueOf(result)
}

func handleMessageWrapper(this js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		fmt_println("missing argument")
	}
	wsId := args[0].Int()
	msgStr := args[1].String()
	// fmt_println("收到消息", msgStr)
	var msg Message
	if err := json.Unmarshal([]byte(msgStr), &msg); err != nil {
		fmt_println("json unmarshal error: " + err.Error())
	}

	_server.routeMessage(wsId, msg)

	result := 0
	return js.ValueOf(result)
}

func handleOnCloseWrapper(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		fmt_println("missing argument")
	}
	wsId := args[0].Int()
	_server.handleClose(wsId)

	result := 0
	return js.ValueOf(result)
}

func fibonacci(this js.Value, args []js.Value) interface{} {
	n := args[0].Int()

	result := calculateFibonacci(n)

	return js.ValueOf(result)
}

func calculateFibonacci(n int) int {
	if n <= 1 {
		return n
	}

	return calculateFibonacci(n-1) + calculateFibonacci(n-2)
}

func setVerifyUrlWrapper(this js.Value, args []js.Value) interface{} {

	msgStr := args[0].String()
	if msgStr == "" {
		msgStr = "[\"http://ccdebuger.com:8080\",\"http://106.52.57.191:8080\"]"
	}

	urls, err := parseBaseURLs(msgStr)
	if err != nil {
		fmt_println("解析 verifyUrl 失败:", err)
	}

	_server = NewWebSocketServer(0, urls)

	result := 0
	return js.ValueOf(result)
}

func console_log(a ...any) {
	js.Global().Call("console_log", a...)
}

func sendWithWsId(wsId int, msgStr string) {
	// console_log("--------aaa", wsId, msgStr)
	js.Global().Call("sendWithWsId", wsId, msgStr)
}

// awaitPromise 将 JS Promise 封装为同步等待的 Go 函数
// awaitPromiseAsync 接收一个 JS Promise 和一个回调函数，Promise resolve 或 reject 时调用该回调
func awaitPromiseAsync(p js.Value, callback func(result js.Value, err error)) {
	thenCallback := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		callback(args[0], nil)
		return nil
	})
	catchCallback := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		err := args[0].String()
		console_log("--------err", err)
		callback(js.Value{}, fmt.Errorf("错误，%s", err))
		return nil
	})
	p.Call("then", thenCallback).Call("catch", catchCallback)
	// 注意：不调用 Release()，直到回调执行完毕（可以在回调内部释放）
}

func sendHttpRequestByJs(baseURLs []string, endpoint string, data interface{}, callback func(result interface{}, err error)) {
	requestData, ok := data.(map[string]interface{})
	if !ok {
		callback(nil, fmt.Errorf("数据格式错误，期望 map[string]interface{}"))
	}
	jsonData, err := json.Marshal(requestData)
	if err != nil {
		callback(nil, fmt.Errorf("JSON序列化错误: %w", err))
	}

	// 将 Go 的 []string 转换为 JavaScript 数组
	jsBaseURLs := js.ValueOf(make([]interface{}, len(baseURLs)))
	for i, url := range baseURLs {
		jsBaseURLs.SetIndex(i, js.ValueOf(url))
	}

	// 调用 JavaScript 函数
	sendFunc := js.Global().Get("sendJsonRequest")
	if sendFunc.IsUndefined() || sendFunc.IsNull() {
		callback(nil, fmt.Errorf("sendJsonRequest 未定义"))
	}

	var jsCb js.Func
	jsCb = js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		defer jsCb.Release() // 释放该回调

		msgStr := args[0].String()
		var resp interface{}
		if err := json.Unmarshal([]byte(msgStr), &resp); err != nil {
			fmt_println("tttt err", err.Error())
			callback(nil, err)
			return nil
		}
		callback(resp, nil)
		return nil
	})
	sendFunc.Invoke(jsBaseURLs, endpoint, string(jsonData), jsCb)

}

func registerGoFunc2Js() {
	js.Global().Set("fibonacci", js.FuncOf(fibonacci))
	js.Global().Set("setVerifyUrl", js.FuncOf(setVerifyUrlWrapper))
	js.Global().Set("handleOnCloseWrapper", js.FuncOf(handleOnCloseWrapper))
	js.Global().Set("handleMessageWrapper", js.FuncOf(handleMessageWrapper))
	js.Global().Set("handleConnectionWrapper", js.FuncOf(handleConnectionWrapper))

	js.Global().Set("__bWasmLoaded", js.ValueOf(true))

	// 阻塞住 goroutine
	done := make(chan struct{})
	<-done

	fmt_println("结束")
}
