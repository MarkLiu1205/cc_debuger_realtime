package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

func test() {
	// 获取操作系统信息
	osType := runtime.GOOS
	fmt.Printf("Operating System: %s\n", osType)

	// 获取设备号或唯一标识符
	deviceID, err := getDeviceID()
	if err != nil {
		fmt.Printf("Error getting device ID: %v\n", err)
	} else {
		fmt.Printf("Device ID: %s\n", deviceID)
	}
}

// 声明HTTP端点URL常量
const (
	verifyEndpoint     = "/verify"
	statisticsEndpoint = "/stats"
)

const (
	State_none = 0
	//未通过验证
	State_unverified = 1
	//在试用期中
	State_in_trial = 2
	//已经验证通过
	State_verify_success = 3
	//激活码过期了
	State_verify_expired = 4
)

var (
	m_verifyState = State_none
	m_authorInfo  = map[string]interface{}{
		"githubUrl":     "https://github.com/hyz1992/cc_debuger_realtime_publish.git",
		"cocosStoreUrl": "https://store.cocos.com/app/search?name=%E8%8A%B1%E5%A4%A9%E7%8B%82%E9%AA%A8",
		"helpDocUrl":    "https://www.cocos.com/products?b=1",
		"feedbackUrl":   "https://www.cocos.com/products?b=2",
		"qq":            []string{"1451784145"},
		"qqgroups":      []string{"581563429"},
		"wechat":        []string{"busky192"},
	}
)

func isVerified() bool {
	return m_verifyState == State_in_trial || m_verifyState == State_verify_success
}

func dealFakeData(msg *Message) {
	if m_verifyState == State_verify_success {
		return
	}
	activationCode := ""
	latestVersion := "1.1.0"

	verifyInfo := VerifyInfo{
		EndTime:        0,
		State:          m_verifyState,
		ActivationCode: activationCode,
		LatestVersion:  latestVersion,
		AuthorInfo:     m_authorInfo,
	}

	if m_verifyState == State_in_trial { //试用期
		endTime := time.Now().Unix() + 3600*25
		verifyInfo.EndTime = endTime

		msg.VerifyInfo = verifyInfo

	} else if m_verifyState == State_unverified { //验证失败
		msg.VerifyInfo = verifyInfo
	} else if m_verifyState == State_verify_expired { //激活码过期

		endTime := time.Now().Unix() + 3600*25
		verifyInfo.EndTime = endTime
	}
}

func (s *WebSocketServer) doVerify(wsId int, msg *Message) {
	if dataMap, ok := msg.Data.(map[string]interface{}); ok {
		deviceID, err := getDeviceID()
		if err == nil {
			if dataMap["deviceId"] == nil || dataMap["deviceId"] == "" {
				dataMap["deviceId"] = deviceID
			}
		}
	} else {
		fmt_println(fmt.Errorf("invalid data format"))
	}
	// printInterface(msg.Data)

	if false {
		ret := msg

		m_verifyState = State_in_trial

		endTime := time.Now().Unix() + 3600*25
		activationCode := "55555"
		latestVersion := "1.1.0"
		verifyInfo := map[string]interface{}{
			"endTime":        endTime,
			"state":          m_verifyState,
			"activationCode": activationCode,
			"latestVersion":  latestVersion,
			"authorInfo":     m_authorInfo,
		}

		ret.Data = verifyInfo
		ret.Type = "response"
		// printInterface(ret.Data)
		s.writeMessage(wsId, ret)

	}

	// 直接发送原始JSON数据
	s.sendJSONRequest(verifyEndpoint, msg.Data, func(resp interface{}, err error) {
		if err != nil {
			fmt_println(fmt.Sprintf("验证请求失败: %s", err.Error()))
			return
		}

		if respMap, ok := resp.(map[string]interface{}); ok {
			if authorInfo, ok := respMap["authorInfo"].(map[string]interface{}); ok {
				m_authorInfo = authorInfo
			}
			switch state := respMap["state"].(type) {
			case int:
				m_verifyState = state
			case float32:
				m_verifyState = int(state)
			case float64:
				m_verifyState = int(state)
			default:
				fmt_println(fmt.Errorf("unexpected state type: %T", respMap["state"]).Error())
			}
		} else {
			fmt_println("unexpected response format")
		}

		response := Message{
			Type:      "response",
			Action:    msg.Action,
			RequestID: msg.RequestID,
			Data:      resp,
		}
		s.writeMessage(wsId, response)
	})

}

func printInterface(data interface{}) {
	// 将 data 序列化为 JSON 字符串并打印
	dataJSON, err := json.Marshal(data)
	if err != nil {
		fmt_println("Failed to marshal data: ", err)
	} else {
		fmt_println("data: ", string(dataJSON))
	}
}

func (s *WebSocketServer) doStatistics(wsId int, msg *Message) {
	// 直接发送原始JSON数据
	s.sendJSONRequest(statisticsEndpoint, msg.Data, func(resp interface{}, err error) {
		if err != nil {
			fmt_println(fmt.Errorf("统计请求失败: %w", err).Error())
		}

		response := Message{
			Type:      "response",
			Action:    msg.Action,
			RequestID: msg.RequestID,
			Data:      resp,
		}
		s.writeMessage(wsId, response)
	})
}

// 公共请求方法封装
func (s *WebSocketServer) sendJSONRequest(endpoint string, data interface{}, callback func(result interface{}, err error)) {
	if isJsWasm() {
		sendHttpRequestByJs(s.baseURLs, endpoint, data, callback)
		return
	}
	requestData, ok := data.(map[string]interface{})
	if !ok {
		callback(nil, fmt.Errorf("数据格式错误，期望 map[string]interface{}"))
	}
	console_log("qqqqq 2")
	// 确保 cocos_uid 是字符串
	if cocosUID, exists := requestData["cocos_uid"]; exists {
		switch v := cocosUID.(type) {
		case string:
			// 已经是字符串，无需转换
		case int, int32, int64:
			requestData["cocos_uid"] = fmt.Sprintf("%d", v)
		case float32, float64:
			uid := v.(float64)
			requestData["cocos_uid"] = fmt.Sprintf("%d", int(uid))
		default:
			callback(nil, fmt.Errorf("cocos_uid 类型不支持: %T", v))
		}
	}
	console_log("qqqqq 3")
	jsonData, err := json.Marshal(requestData)
	if err != nil {
		callback(nil, fmt.Errorf("JSON序列化错误: %w", err))
	}
	console_log("qqqqq 4", string(jsonData))
	// 重试逻辑
	var lastErr error
	for _, baseURL := range s.baseURLs {
		fmt_println("verify url", baseURL)
		req, err := http.NewRequest("POST", baseURL+endpoint, bytes.NewBuffer(jsonData))
		if err != nil {
			fmt_println("http err 1", err.Error())
			lastErr = fmt.Errorf("请求构造失败 (URL: %s): %w", baseURL, err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := s.httpClient.Do(req)
		if err != nil {
			fmt_println("http err 2", err.Error())
			lastErr = fmt.Errorf("网络请求异常 (URL: %s): %w", baseURL, err)
			continue
		}
		defer resp.Body.Close()
		console_log("qqqqq 5", resp.Status)
		var result map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			lastErr = fmt.Errorf("响应解析失败 (URL: %s): %w", baseURL, err)
			continue
		}
		result["statusCode"] = resp.StatusCode

		// 请求成功，返回结果
		callback(result, nil)
		return
	}

	// 所有地址都失败，返回最后一个错误
	if lastErr != nil {
		callback(nil, fmt.Errorf("所有地址请求失败: %w", lastErr))
	}
	callback(nil, fmt.Errorf("没有可用的 baseURL"))
}

// getDeviceID 获取设备号或唯一标识符
func getDeviceID() (string, error) {
	osType := runtime.GOOS
	var cmd *exec.Cmd

	switch osType {
	case "darwin": // macOS
		cmd = exec.Command("ioreg", "-rd1", "-c", "IOPlatformExpertDevice")
	case "windows": // Windows
		cmd = exec.Command("wmic", "csproduct", "get", "UUID")
	default:
		return "", fmt.Errorf("unsupported operating system: %s", osType)
	}

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to execute command: %w", err)
	}

	deviceID := parseDeviceID(output, osType)
	if deviceID == "" {
		return "", fmt.Errorf("failed to parse device ID")
	}

	return deviceID, nil
}

// parseDeviceID 解析设备号或唯一标识符
func parseDeviceID(output []byte, osType string) string {
	switch osType {
	case "darwin": // macOS
		return parseMacDeviceID(output)
	case "windows": // Windows
		return parseWindowsDeviceID(output)
	default:
		return ""
	}
}

// parseMacDeviceID 解析 macOS 设备号
func parseMacDeviceID(output []byte) string {
	// 示例输出:
	// | "IOPlatformUUID" = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
	lines := string(output)
	for _, line := range lines {
		if strings.Contains(string(line), "IOPlatformUUID") {
			parts := strings.Split(string(line), "\"")
			if len(parts) > 3 {
				return parts[3]
			}
		}
	}
	return ""
}

// parseWindowsDeviceID 解析 Windows 设备号
func parseWindowsDeviceID(output []byte) string {
	// 示例输出:
	// UUID
	// XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	lines := strings.Split(string(output), "\n")
	if len(lines) > 1 {
		return strings.TrimSpace(lines[1])
	}
	return ""
}
