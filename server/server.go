package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// 封装服务器状态
type WebSocketServer struct {
	port          int
	upgrader      websocket.Upgrader
	pluginConn    int                     // 插件端连接
	activeRuntime int                     // 当前活跃运行时连接
	runtimes      []*RuntimeInfo          // 所有运行时连接列表
	connInfo      map[int]*ConnectionInfo // 连接信息映射（包含写锁）
	mutex         sync.RWMutex            // 并发控制锁（改为读写锁）
	baseURLs      []string
	httpClient    *http.Client
}

// 存储运行时连接信息
type RuntimeInfo struct {
	wsId int
	name string
}

// 记录连接详细信息（包含写锁）
type ConnectionInfo struct {
	IP     string
	Port   string
	Family string
	mu     sync.Mutex // 每个连接的独立写锁
}

type VerifyInfo struct {
	EndTime        int64       `json:"endTime,omitempty"`
	State          int         `json:"state,omitempty"`
	ActivationCode string      `json:"activationCode,omitempty"`
	LatestVersion  string      `json:"latestVersion,omitempty"`
	AuthorInfo     interface{} `json:"authorInfo,omitempty"`
}

var (
	_keyArr []int = []int{}
)

// 定义消息结构
type Message struct {
	Type       string      `json:"type"`
	Action     string      `json:"action,omitempty"`
	Role       string      `json:"role,omitempty"`
	IsSplit    bool        `json:"isSplit,omitempty"`
	Data       interface{} `json:"data,omitempty"`
	RequestID  int         `json:"requestId,omitempty"`
	Name       string      `json:"name,omitempty"`
	Total      int         `json:"total,omitempty"`
	Idx        int         `json:"idx,omitempty"`
	VerifyInfo VerifyInfo  `json:"verifyInfo,omitempty"`
	Encrypted  int         `json:"encrypted,omitempty"`
}

// 构造服务器实例
func NewWebSocketServer(port int, baseURLs []string) *WebSocketServer {
	return &WebSocketServer{
		port: port,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
		connInfo: make(map[int]*ConnectionInfo),
		baseURLs: baseURLs,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// 启动WebSocket服务器
func (s *WebSocketServer) Start() {
	http.HandleFunc("/", s.handleConnection)
	fmt_println("WebSocket server running on ws://localhost:", s.port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", s.port), nil))
}

var (
	_wsAcc    int
	_wsMap1   map[*websocket.Conn]int = make(map[*websocket.Conn]int)
	_wsMutex1 sync.Mutex

	_wsMap2   map[int]*websocket.Conn = make(map[int]*websocket.Conn)
	_wsMutex2 sync.Mutex
)

func GetIdOfSocket(conn *websocket.Conn) int {
	_wsMutex1.Lock()
	defer _wsMutex1.Unlock()

	if id, exists := _wsMap1[conn]; exists {
		return id
	}

	_wsAcc++
	_wsMap1[conn] = _wsAcc
	_wsMap2[_wsAcc] = conn
	return _wsAcc
}

func GetSocketById(wsId int) *websocket.Conn {
	_wsMutex2.Lock()
	defer _wsMutex2.Unlock()
	if conn, exists := _wsMap2[wsId]; exists {
		return conn
	}
	return nil
}

func GetConnInfoOfWsId(wsId int) (*ConnectionInfo, bool) {
	s := _server
	s.mutex.RLock()
	info, exists := s.connInfo[wsId]
	s.mutex.RUnlock()
	return info, exists
}

// 处理新连接
func (s *WebSocketServer) handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt_println("Upgrade error:", err)
		return
	}

	wsId := GetIdOfSocket(conn)

	s.OnRealConnection(wsId, r.RemoteAddr, r.URL.Query().Get("port"), "tcp")

	go s.handleMessages(conn)
}

func (s *WebSocketServer) OnRealConnection(wsId int, ip string, port string, family string) {

	s.mutex.Lock()
	s.connInfo[wsId] = &ConnectionInfo{
		IP:     ip,
		Port:   port,
		Family: "tcp",
	}
	s.mutex.Unlock()

	fmt_println("New client connected from: ", ip)
}

// 安全写入消息（带连接级锁）
func (s *WebSocketServer) writeMessage(wsId int, msg interface{}) error {
	info, exists := GetConnInfoOfWsId(wsId)

	if !exists {
		return fmt.Errorf("connection not found")
	}

	info.mu.Lock()

	// tipStr := ""
	// if conn == s.activeRuntime {
	// 	tipStr = "我发给runtime"
	// } else {
	// 	tipStr = "我发给plugin"
	// }

	// m, ok := msg.(Message)
	// if ok {
	// 	if m.IsSplit {
	// 		fmt_println(tipStr, m.Total, m.Idx)
	// 	} else {
	// 		// jsonData, err := json.Marshal(msg)
	// 		// if err == nil {
	// 		// 	fmt.Printf("\n%s: %s", tipStr, jsonData)
	// 		// }
	// 		fmt_println(tipStr, m.Type, m.Action)
	// 	}
	// }
	if isJsWasm() {
		jsonData, err := json.Marshal(msg)
		if err == nil {
			sendWithWsId(wsId, string(jsonData))
		} else {
			fmt_println("msg is not a string")
		}
		info.mu.Unlock()

		return nil
	} else {
		conn := GetSocketById(wsId)

		ret := conn.WriteJSON(msg)
		info.mu.Unlock()

		return ret
	}
}

// 处理消息接收与路由
func (s *WebSocketServer) handleMessages(conn *websocket.Conn) {
	defer func() {
		wsId := GetIdOfSocket(conn)
		s.handleClose(wsId)
		conn.Close()
	}()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msg Message
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			fmt_println("JSON decode error:", err)
			continue
		}

		// // 根据连接类型打印日志
		// if conn == s.activeRuntime {
		// 	if msg.IsSplit {
		// 		fmt_println("\n从Runtime 发来消息,IsSplit:", msg.Total, msg.Idx)
		// 	} else {
		// 		// fmt_println("\n从Runtime 发来消息:", string(msgBytes))
		// 		fmt_println("\n从Runtime 发来消息:", msg.Type, msg.Action)
		// 	}

		// } else if conn == s.pluginConn {
		// 	// fmt_println("\nPlugin 发来消息:", string(msgBytes))
		// 	fmt_println("\nPlugin 发来消息:", msg.Type, msg.Action)
		// }

		wsId := GetIdOfSocket(conn)
		s.routeMessage(wsId, msg)
	}
}

// 分发消息
func (s *WebSocketServer) routeMessage(wsId int, msg Message) {
	if msg.Type == "identify" {
		s.handleIdentify(wsId, msg)
	} else if msg.IsSplit {
		s.forwardMessage(wsId, msg)
	} else if msg.Type == "request" {
		s.handleRequest(wsId, msg)
	} else if msg.Type == "response" {
		s.forwardMessage(wsId, msg)
	} else if msg.Type == "push" {
		s.handlePush(wsId, msg)
	} else {
		fmt_println("Unhandled message type: ", msg.Type)
	}
}

// 处理身份识别消息
func (s *WebSocketServer) handleIdentify(wsId int, msg Message) {

	switch msg.Role {
	case "runtime":
		if msg.Name == "" {
			info, exists := GetConnInfoOfWsId(wsId)
			if exists {
				fmt_println("[WARN] Empty runtime name from ", info.IP)
			}
			return
		}
		s.mutex.Lock()
		runtimeName := s.addRuntime(wsId, msg.Name)
		s.mutex.Unlock()
		fmt_println("Runtime registered: ", runtimeName)

		if s.activeRuntime == 0 {
			s.activeRuntime = wsId
		}

		if s.pluginConn != 0 {
			s._doSelectActiveRuntime("")
			s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), true)
		}
		s.updateRuntimeList()

	case "plugin":
		s.pluginConn = wsId
		fmt_println("Plugin registered")
		if s.activeRuntime != 0 {
			s._doSelectActiveRuntime("")
			s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), true)
		}
		s.updateRuntimeList()
	}
}

func DecryptMsg(msg *Message) {
	if msg.Encrypted == 1 {
		jsonStr := ""
		if dataStr, ok := msg.Data.(string); ok {
			jsonStr = Decrypt(dataStr, parseKey(_keyArr))
			if err := json.Unmarshal([]byte(jsonStr), &msg.Data); err != nil {
				fmt.Println("JSON Unmarshal error:", err)
			}
		}
		msg.Action = Decrypt(msg.Action, parseKey(_keyArr))
	}
}

// 处理请求消息
func (s *WebSocketServer) handleRequest(wsId int, msg Message) {
	action := msg.Action
	if action == "checkOtherSideIsInline" {
		s.handleCheckOnline(wsId, msg)
		return
	}
	if msg.Encrypted == 1 {
		action = Decrypt(action, parseKey(_keyArr))
	} else {
		if action == "getArr" {
			msg.Type = "response"
			msg.Data = _keyArr
			s.writeMessage(wsId, msg)
			return
		}
	}

	//校验激活码
	if wsId == s.pluginConn {
		if action == "VerifyActivationCode" {
			if msg.Encrypted == 1 {
				DecryptMsg(&msg)
			}
			s.doVerify(wsId, &msg)
			return
		} else if action == "Statistics" {
			if msg.Encrypted == 1 {
				DecryptMsg(&msg)
			}
			s.doStatistics(wsId, &msg)
			return
		}
	}
	if wsId == s.pluginConn {
		if !isVerified() {
			DecryptMsg(&msg)
			dealFakeData(&msg)
			msg.Type = "response"
			s.writeMessage(wsId, msg)
			return
		}
	}
	s.forwardMessage(wsId, msg)
}

// 检查对端是否在线
func (s *WebSocketServer) handleCheckOnline(wsId int, msg Message) {
	var online bool
	s.mutex.Lock()
	if wsId == s.pluginConn {
		online = s.activeRuntime != 0
	} else if wsId == s.activeRuntime {
		online = s.pluginConn != 0
	}
	s.mutex.Unlock()

	response := Message{
		Type:      "response",
		Action:    msg.Action,
		RequestID: msg.RequestID,
		Data:      online,
	}
	s.writeMessage(wsId, response)
}

// 处理推送消息
func (s *WebSocketServer) handlePush(wsId int, msg Message) {
	if msg.Action == "selectActiveRuntime" {
		s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), false)
		if runtimeName, ok := msg.Data.(string); ok {
			s._doSelectActiveRuntime(runtimeName)
			s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), true)
		} else {
			fmt_println("Invalid runtime name in selectActiveRuntime")
		}
		return
	}
	if wsId == s.activeRuntime {
		dealFakeData(&msg)
	}
	s.forwardMessage(wsId, msg)
}

func printMsg(msg *Message) {
	msgBytes, err := json.MarshalIndent(msg, "", "  ")
	if err != nil {
		fmt_println("Error marshaling msg:", err)
		return
	}
	fmt_println("Message content:", string(msgBytes))
}

// 转发消息到目标连接
func (s *WebSocketServer) forwardMessage(srcWsId int, msg Message) {
	s.mutex.RLock()
	target := s.getTargetConnection(srcWsId)
	s.mutex.RUnlock()

	if target != 0 {
		if err := s.writeMessage(target, msg); err != nil {
			fmt_println("Forward message failed: ", err)
		}
	}
}

// 根据来源判断转发方向
func (s *WebSocketServer) getTargetConnection(src int) int {
	if src == s.pluginConn {
		return s.activeRuntime
	}
	if src == s.activeRuntime {
		return s.pluginConn
	}
	return 0
}

// 添加运行时连接
func (s *WebSocketServer) addRuntime(wsId int, name string) string {
	// 检查名称冲突
	if s.getRuntimeByName(name) != nil {
		name += "_1"
	}
	s.runtimes = append(s.runtimes, &RuntimeInfo{
		wsId: wsId,
		name: name,
	})
	return name
}

// 更新运行时列表（通知插件端）
func (s *WebSocketServer) updateRuntimeList() {
	s.mutex.Lock()
	names := make([]string, 0, len(s.runtimes))
	for _, r := range s.runtimes {
		names = append(names, r.name)
	}
	pluginConn := s.pluginConn
	s.mutex.Unlock()

	if pluginConn == 0 {
		return
	}

	s.writeMessage(pluginConn, Message{
		Type:   "push",
		Action: "pushRuntimeList",
		Data:   names,
	})
}

// 优化后的连接关闭处理
func (s *WebSocketServer) handleClose(wsId int) {

	// 清理连接信息
	s.mutex.Lock()
	delete(s.connInfo, wsId)
	s.mutex.Unlock()

	// 处理运行时连接
	if wsId == s.activeRuntime {
		s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), false)

		s.mutex.Lock()
		s.activeRuntime = 0
		s.removeRuntime(wsId)

		fmt_println("Runtime disconnected")
		s.mutex.Unlock()

		s.updateRuntimeList()
		if len(s.runtimes) > 0 {
			newName := s.runtimes[0].name
			if newName != "" {
				s.sendConnectionUpdate(newName, true)
				s.activeRuntime = s.runtimes[0].wsId
				msg := Message{Type: "push", Action: "markActive", Data: map[string]interface{}{"isActive": true, "wsArr": _keyArr}}
				s.writeMessage(s.activeRuntime, msg)
			}
		}
	} else if wsId == s.pluginConn {
		s.mutex.Lock()
		s.pluginConn = 0
		s.mutex.Unlock()
		fmt_println("Plugin disconnected")
		if s.activeRuntime != 0 {
			msg := Message{Type: "push", Action: "markActive", Data: map[string]interface{}{"isActive": false}}
			s.writeMessage(s.activeRuntime, msg)
		}
	}

	// }()
}

// 从运行时列表移除连接
func (s *WebSocketServer) removeRuntime(wsId int) {
	for i := len(s.runtimes) - 1; i >= 0; i-- {
		if s.runtimes[i].wsId == wsId {
			s.runtimes = append(s.runtimes[:i], s.runtimes[i+1:]...)
		}
	}
}

// 激活运行时切换
func (s *WebSocketServer) _doSelectActiveRuntime(name string) {
	s.mutex.Lock()

	oldRuntime := s.activeRuntime
	newRuntime := s.activeRuntime
	if name != "" {
		newRuntime = s.getRuntimeByName(name).wsId
	}

	s.activeRuntime = newRuntime
	s.mutex.Unlock()

	if oldRuntime != 0 && oldRuntime != newRuntime {
		msg := Message{Type: "push", Action: "markActive", Data: map[string]interface{}{"isActive": false}}
		s.writeMessage(oldRuntime, msg)
	}
	msg := Message{Type: "push", Action: "markActive", Data: map[string]interface{}{"isActive": true, "wsArr": _keyArr}}
	s.writeMessage(newRuntime, msg)
}

// 发送连接状态更新给插件端
func (s *WebSocketServer) sendConnectionUpdate(name string, bOnline bool) {
	if s.pluginConn == 0 {
		return
	}

	s.mutex.Lock()
	activeRuntime := s.getRuntimeByName(name)
	s.mutex.Unlock()
	if activeRuntime == nil {
		return
	}

	info, _ := GetConnInfoOfWsId(activeRuntime.wsId)
	msg := Message{
		Type:   "push",
		Action: "otherSideOnlineChange",
		Data: map[string]interface{}{
			"bIsOnline": bOnline,
			"name":      name,
			"info":      info,
		},
	}
	s.writeMessage(s.pluginConn, msg)

}

// 根据名称查找运行时
func (s *WebSocketServer) getRuntimeByName(name string) *RuntimeInfo {
	for _, r := range s.runtimes {
		if r.name == name {
			return r
		}
	}
	return nil
}

// 获取运行时名称
func (s *WebSocketServer) getRuntimeName(wsId int) string {
	for _, r := range s.runtimes {
		if r.wsId == wsId {
			return r.name
		}
	}
	return ""
}

// 解析命令行参数，支持单一地址或 JSON 数组
func parseBaseURLs(verifyUrl string) ([]string, error) {
	verifyUrl = strings.TrimSpace(verifyUrl)
	if verifyUrl == "" {
		return nil, fmt.Errorf("verifyUrl 不能为空")
	}

	// 如果以 [ 开头，尝试解析为 JSON 数组
	if strings.HasPrefix(verifyUrl, "[") {
		var urls []string
		if err := json.Unmarshal([]byte(verifyUrl), &urls); err != nil {
			return nil, fmt.Errorf("解析 JSON 数组失败: %w", err)
		}
		if len(urls) == 0 {
			return nil, fmt.Errorf("JSON 数组为空")
		}
		return urls, nil
	}

	// 单一地址，直接返回单元素切片
	return []string{verifyUrl}, nil
}

var (
	_server *WebSocketServer = nil
)

func initForExec() {
	port := flag.Int("port", 8085, "server port")
	verifyUrl := flag.String("verifyUrl", "[\"http://ccdebuger.com:8080\",\"http://106.52.57.191:8080\"]", "verifyUrl (单一地址或 JSON 数组)")
	flag.Parse()

	if false {
		*port = 8888
		*verifyUrl = "http://localhost:8080"
	}

	urls, err := parseBaseURLs(*verifyUrl)
	if err != nil {
		log.Fatalf("解析 verifyUrl 失败: %v", err)
	}

	_server = NewWebSocketServer(*port, urls)
	_server.Start()
}

func main() {
	_keyArr = generateKey()
	fmt_println("osType", runtime.GOOS)
	if isJsWasm() {
		registerGoFunc2Js()
	} else {
		initForExec()
	}

}
