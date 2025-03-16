package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"runtime"
	"strconv"
)

func isJsWasm() bool {
	osType := runtime.GOOS
	return osType == "js"
}

func fmt_println(a ...any) {
	if isJsWasm() {
		console_log(a...)
	} else {
		fmt.Println(a...)
	}
}

// 成成一个秘钥（以整形数组的形式）
func generateKey() []int {
	key := make([]byte, 16)
	rand.Read(key)
	hexKey := hex.EncodeToString(key)
	// console_log("hexKey", hexKey)

	segments := make([]int, 4)
	for i := 0; i < 4; i++ {
		val := hexKey[i*8 : (i+1)*8]
		num, _ := strconv.ParseInt(val, 16, 64)
		valStr := strconv.FormatInt(num, 10)
		newStr := ""
		for _, char := range valStr {
			digit, _ := strconv.Atoi(string(char))
			newStr += strconv.Itoa(9 - digit)
		}
		segment, _ := strconv.Atoi(newStr)
		segments[i] = segment
	}

	return segments
}

// 将整形数组还原为字符串
func parseKey(segments []int) string {
	key := ""
	for _, segment := range segments {
		valStr := strconv.Itoa(segment)
		newStr := ""
		for _, char := range valStr {
			digit, _ := strconv.Atoi(string(char))
			newStr += strconv.Itoa(9 - digit)
		}
		num, _ := strconv.ParseInt(newStr, 10, 64)
		key += fmt.Sprintf("%08x", num)
	}
	return key
}

// XOR 加密/解密
func xor(input []byte, key []byte) []byte {
	output := make([]byte, len(input))
	keyLen := len(key)
	for i := 0; i < len(input); i++ {
		output[i] = input[i] ^ key[i%keyLen]
	}
	return output
}

// 加密函数
func Encrypt(input string, key string) string {
	if key == "" {
		fmt.Println("key 不能为空")
		return ""
	}
	inputBytes := []byte(input)
	keyBytes := []byte(key)
	encryptedBytes := xor(inputBytes, keyBytes)
	return base64.StdEncoding.EncodeToString(encryptedBytes)
}

// 解密函数
func Decrypt(base64Input string, key string) string {
	if key == "" {
		fmt.Println("key 不能为空")
		return ""
	}
	decodedBytes, err := base64.StdEncoding.DecodeString(base64Input)
	if err != nil {
		fmt.Println("Base64 解码失败:", err)
		return ""
	}
	keyBytes := []byte(key)
	decryptedBytes := xor(decodedBytes, keyBytes)
	return string(decryptedBytes)
}
