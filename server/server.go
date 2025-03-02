package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocketServer 封装服务器状态
type WebSocketServer struct {
	port          int
	upgrader      websocket.Upgrader
	pluginConn    *websocket.Conn                     // 插件端连接
	activeRuntime *websocket.Conn                     // 当前活跃运行时连接
	runtimes      []*RuntimeInfo                      // 所有运行时连接列表
	connInfo      map[*websocket.Conn]*ConnectionInfo // 连接信息映射（包含写锁）
	mutex         sync.RWMutex                        // 并发控制锁（改为读写锁）
	baseURL       string
	httpClient    *http.Client
}

// RuntimeInfo 存储运行时连接信息
type RuntimeInfo struct {
	conn *websocket.Conn
	name string
}

// ConnectionInfo 记录连接详细信息（包含写锁）
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

// Message 定义消息结构
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
}

// "endTime":        0,
// "state":          verifyState,
// "activationCode": activationCode,
// "latestVersion":  latestVersion,
// "authorInfo":     authorInfo,

// NewWebSocketServer 构造服务器实例
func NewWebSocketServer(port int, verifyUrl string) *WebSocketServer {
	return &WebSocketServer{
		port: port,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
		connInfo: make(map[*websocket.Conn]*ConnectionInfo),
		baseURL:  verifyUrl,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Start 启动WebSocket服务器
func (s *WebSocketServer) Start() {
	http.HandleFunc("/", s.handleConnection)
	fmt.Printf("\nWebSocket server running on ws://localhost:%d", s.port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", s.port), nil))
}

// handleConnection 处理新连接
func (s *WebSocketServer) handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade error:", err)
		return
	}

	s.mutex.Lock()
	s.connInfo[conn] = &ConnectionInfo{
		IP:     r.RemoteAddr,
		Port:   r.URL.Query().Get("port"),
		Family: "tcp",
	}
	s.mutex.Unlock()

	fmt.Printf("\nNew client connected from: %s", r.RemoteAddr)
	go s.handleMessages(conn)
}

// writeMessage 安全写入消息（带连接级锁）
func (s *WebSocketServer) writeMessage(conn *websocket.Conn, msg interface{}) error {
	s.mutex.RLock()
	info, exists := s.connInfo[conn]
	s.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("connection not found")
	}

	info.mu.Lock()

	// jsonData, err := json.Marshal(msg)
	// if err != nil {

	// } else {
	// 	fmt.Printf("\n向外发送: %s", jsonData)
	// }

	ret := conn.WriteJSON(msg)
	info.mu.Unlock()

	return ret
}

// handleMessages 处理消息接收与路由
func (s *WebSocketServer) handleMessages(conn *websocket.Conn) {
	defer func() {
		s.handleClose(conn)
		conn.Close()
	}()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msg Message
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			fmt.Println("JSON decode error:", err)
			continue
		}

		s.routeMessage(conn, msg)

		// 根据连接类型打印日志
		// isActiveRuntime := (conn == s.activeRuntime)
		// isPlugin := (conn == s.pluginConn)
		// if isActiveRuntime {
		// 	fmt.Println("\nRuntime message:", string(msgBytes))
		// } else if isPlugin {
		// 	fmt.Println("\nPlugin message:", string(msgBytes))
		// }
	}
}

// routeMessage 分发消息
func (s *WebSocketServer) routeMessage(conn *websocket.Conn, msg Message) {
	if msg.Type == "identify" {
		s.handleIdentify(conn, msg)
	} else if msg.IsSplit {
		s.forwardMessage(conn, msg)
	} else if msg.Type == "request" {
		s.handleRequest(conn, msg)
	} else if msg.Type == "response" {
		s.forwardMessage(conn, msg)
	} else if msg.Type == "push" {
		s.handlePush(conn, msg)
	} else {
		fmt.Printf("\nUnhandled message type: %s", msg.Type)
	}
}

// handleIdentify 处理身份识别消息
func (s *WebSocketServer) handleIdentify(conn *websocket.Conn, msg Message) {

	switch msg.Role {
	case "runtime":
		if msg.Name == "" {
			fmt.Printf("\n[WARN] Empty runtime name from %s", conn.RemoteAddr())
			return
		}
		s.mutex.Lock()
		runtimeName := s.addRuntime(conn, msg.Name)
		s.mutex.Unlock()
		fmt.Printf("\nRuntime registered: %s", runtimeName)

		if s.activeRuntime == nil {
			s.activeRuntime = conn
		}

		if s.pluginConn != nil {
			s._doSelectActiveRuntime("")
			s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), true)
		}
		s.updateRuntimeList()

	case "plugin":
		s.pluginConn = conn
		fmt.Println("Plugin registered")
		if s.activeRuntime != nil {
			s._doSelectActiveRuntime("")
			s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), true)
		}
		s.updateRuntimeList()
	}
}

// handleRequest 处理请求消息
func (s *WebSocketServer) handleRequest(conn *websocket.Conn, msg Message) {
	if msg.Action == "checkOtherSideIsInline" {
		s.handleCheckOnline(conn, msg)
		return
	}
	//校验激活码
	if conn == s.pluginConn {
		if msg.Action == "VerifyActivationCode" {
			s.doVerify(conn, &msg)
			return
		} else if msg.Action == "Statistics" {
			s.doStatistics(conn, &msg)
			return
		}
	}
	if conn == s.pluginConn {
		dealFakeData(&msg)
		if !isVerified() {
			msg.Type = "response"
			s.writeMessage(conn, msg)
			return
		}
	}
	s.forwardMessage(conn, msg)
}

// handleCheckOnline 检查对端是否在线
func (s *WebSocketServer) handleCheckOnline(conn *websocket.Conn, msg Message) {
	var online bool
	s.mutex.Lock()
	if conn == s.pluginConn {
		online = s.activeRuntime != nil
	} else if conn == s.activeRuntime {
		online = s.pluginConn != nil
	}
	s.mutex.Unlock()

	response := Message{
		Type:      "response",
		Action:    msg.Action,
		RequestID: msg.RequestID,
		Data:      online,
	}
	conn.WriteJSON(response)
}

// 处理推送消息
func (s *WebSocketServer) handlePush(conn *websocket.Conn, msg Message) {
	if msg.Action == "selectActiveRuntime" {
		s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), false)
		if runtimeName, ok := msg.Data.(string); ok {
			s._doSelectActiveRuntime(runtimeName)
			s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), true)
		} else {
			fmt.Println("Invalid runtime name in selectActiveRuntime")
		}
		return
	}
	if conn == s.activeRuntime {
		dealFakeData(&msg)
	}
	s.forwardMessage(conn, msg)
}

func printMsg(msg *Message) {
	msgBytes, err := json.MarshalIndent(msg, "", "  ")
	if err != nil {
		fmt.Println("Error marshaling msg:", err)
		return
	}
	fmt.Println("Message content:", string(msgBytes))
}

// forwardMessage 转发消息到目标连接
func (s *WebSocketServer) forwardMessage(src *websocket.Conn, msg Message) {
	s.mutex.RLock()
	target := s.getTargetConnection(src)
	s.mutex.RUnlock()

	if target != nil {
		if err := s.writeMessage(target, msg); err != nil {
			fmt.Printf("\nForward message failed: %v", err)
		}
	}
}

// getTargetConnection 根据来源判断转发方向
func (s *WebSocketServer) getTargetConnection(src *websocket.Conn) *websocket.Conn {
	if src == s.pluginConn {
		return s.activeRuntime
	}
	if src == s.activeRuntime {
		return s.pluginConn
	}
	return nil
}

// addRuntime 添加运行时连接
func (s *WebSocketServer) addRuntime(conn *websocket.Conn, name string) string {
	// 检查名称冲突
	if s.getRuntimeByName(name) != nil {
		name += "_1"
	}
	s.runtimes = append(s.runtimes, &RuntimeInfo{
		conn: conn,
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

	if pluginConn == nil {
		return
	}

	s.writeMessage(pluginConn, Message{
		Type:   "push",
		Action: "pushRuntimeList",
		Data:   names,
	})
}

// handleClose 优化后的连接关闭处理
func (s *WebSocketServer) handleClose(conn *websocket.Conn) {

	// 清理连接信息
	s.mutex.Lock()
	delete(s.connInfo, conn)
	s.mutex.Unlock()

	// 处理运行时连接
	if conn == s.activeRuntime {
		s.sendConnectionUpdate(s.getRuntimeName(s.activeRuntime), false)

		s.mutex.Lock()
		s.activeRuntime = nil
		s.removeRuntime(conn)

		fmt.Println("Runtime disconnected")
		s.mutex.Unlock()

		s.updateRuntimeList()
		if len(s.runtimes) > 0 {
			newName := s.runtimes[0].name
			if newName != "" {
				s.sendConnectionUpdate(newName, true)
				s.activeRuntime = s.runtimes[0].conn
				msg := Message{Type: "push", Action: "markActive", Data: true}
				s.writeMessage(s.activeRuntime, msg)
			}
		}
	} else if conn == s.pluginConn {
		s.mutex.Lock()
		s.pluginConn = nil
		s.mutex.Unlock()
		fmt.Println("Plugin disconnected")
		if s.activeRuntime != nil {
			msg := Message{Type: "push", Action: "markActive", Data: false}
			s.writeMessage(s.activeRuntime, msg)
		}
	}

	// }()
}

// 从运行时列表移除连接
func (s *WebSocketServer) removeRuntime(conn *websocket.Conn) {
	for i := len(s.runtimes) - 1; i >= 0; i-- {
		if s.runtimes[i].conn == conn {
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
		newRuntime = s.getRuntimeByName(name).conn
	}

	s.activeRuntime = newRuntime
	s.mutex.Unlock()

	if oldRuntime != nil && oldRuntime != newRuntime {
		msg := Message{Type: "push", Action: "markActive", Data: false}
		s.writeMessage(oldRuntime, msg)
	}
	msg := Message{Type: "push", Action: "markActive", Data: true}
	s.writeMessage(newRuntime, msg)
}

// 发送连接状态更新给插件端
func (s *WebSocketServer) sendConnectionUpdate(name string, bOnline bool) {
	if s.pluginConn == nil {
		return
	}

	s.mutex.Lock()
	activeRuntime := s.getRuntimeByName(name)
	if activeRuntime == nil {
		s.mutex.Unlock()
		return
	}
	info := s.connInfo[activeRuntime.conn]
	s.mutex.Unlock()

	s.writeMessage(s.pluginConn, Message{
		Type:   "push",
		Action: "otherSideOnlineChange",
		Data: map[string]interface{}{
			"bIsOnline": bOnline,
			"name":      name,
			"info":      info,
		},
	})

}

// getRuntimeByName 根据名称查找运行时
func (s *WebSocketServer) getRuntimeByName(name string) *RuntimeInfo {
	for _, r := range s.runtimes {
		if r.name == name {
			return r
		}
	}
	return nil
}

// getRuntimeName 获取运行时名称
func (s *WebSocketServer) getRuntimeName(conn *websocket.Conn) string {
	for _, r := range s.runtimes {
		if r.conn == conn {
			return r.name
		}
	}
	return ""
}

func main() {
	port := flag.Int("port", 8888, "server port")
	verifyUrl := flag.String("verifyUrl", "http://your-api-server:8080", "verifyUrl")
	flag.Parse()

	server := NewWebSocketServer(*port, *verifyUrl)
	server.Start()
}
