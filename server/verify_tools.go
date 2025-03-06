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

	"github.com/gorilla/websocket"
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
	verifyState  = State_none
	m_authorInfo = map[string]interface{}{
		"helpDocUrl":  "https://www.cocos.com/products?b=1",
		"feedbackUrl": "https://www.cocos.com/products?b=2",
		"qq":          []string{"1451784145", "2273520958"},
		"qqgroups":    []string{"581563429"},
		"wechat":      []string{"busky192"},
	}
)

func isVerified() bool {
	return verifyState == State_in_trial || verifyState == State_verify_success
}

func dealFakeData(msg *Message) {
	if verifyState == State_verify_success {
		return
	}
	activationCode := ""
	latestVersion := "1.1.0"

	verifyInfo := VerifyInfo{
		EndTime:        0,
		State:          verifyState,
		ActivationCode: activationCode,
		LatestVersion:  latestVersion,
		AuthorInfo:     m_authorInfo,
	}

	if verifyState == State_in_trial { //试用期
		endTime := time.Now().Unix() + 3600*25
		verifyInfo.EndTime = endTime

		msg.VerifyInfo = verifyInfo

	} else if verifyState == State_unverified { //验证失败
		msg.VerifyInfo = verifyInfo
	} else if verifyState == State_verify_expired { //激活码过期

		endTime := time.Now().Unix() + 3600*25
		verifyInfo.EndTime = endTime
	}
}

func (s *WebSocketServer) doVerify(conn *websocket.Conn, msg *Message) (interface{}, error) {
	if dataMap, ok := msg.Data.(map[string]interface{}); ok {
		deviceID, err := getDeviceID()
		if err == nil {
			if dataMap["deviceId"] == nil || dataMap["deviceId"] == "" {
				dataMap["deviceId"] = deviceID
			}
		}
	} else {
		return nil, fmt.Errorf("invalid data format")
	}
	printInterface(msg.Data)

	if false {
		ret := msg

		verifyState = State_in_trial

		endTime := time.Now().Unix() + 3600*25
		activationCode := "55555"
		latestVersion := "1.1.0"
		verifyInfo := map[string]interface{}{
			"endTime":        endTime,
			"state":          verifyState,
			"activationCode": activationCode,
			"latestVersion":  latestVersion,
			"authorInfo":     m_authorInfo,
		}

		ret.Data = verifyInfo
		ret.Type = "response"
		printInterface(ret.Data)
		s.writeMessage(conn, ret)
		return nil, nil
	}

	// 直接发送原始JSON数据
	resp, err := s.sendJSONRequest(verifyEndpoint, msg.Data)
	if err != nil {
		return nil, fmt.Errorf("验证请求失败: %w", err)
	}

	response := Message{
		Type:      "response",
		Action:    msg.Action,
		RequestID: msg.RequestID,
		Data:      resp,
	}
	s.writeMessage(conn, response)
	return resp, nil
}

func printInterface(data interface{}) {
	// 将 data 序列化为 JSON 字符串并打印
	dataJSON, err := json.Marshal(data)
	if err != nil {
		fmt.Printf("\nFailed to marshal data: %v\n", err)
	} else {
		fmt.Printf("\ndata: %s\n", dataJSON)
	}
}

func (s *WebSocketServer) doStatistics(conn *websocket.Conn, msg *Message) (interface{}, error) {
	// 直接发送原始JSON数据
	resp, err := s.sendJSONRequest(statisticsEndpoint, msg.Data)
	if err != nil {
		return nil, fmt.Errorf("统计请求失败: %w", err)
	}

	response := Message{
		Type:      "response",
		Action:    msg.Action,
		RequestID: msg.RequestID,
		Data:      resp,
	}
	s.writeMessage(conn, response)
	return resp, nil
}

// 公共请求方法封装
func (s *WebSocketServer) sendJSONRequest(endpoint string, data interface{}) (interface{}, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("JSON序列化错误: %w", err)
	}

	req, err := http.NewRequest("POST", s.baseURL+endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("请求构造失败: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("网络请求异常: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("响应解析失败: %w", err)
	}

	return result, nil
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
