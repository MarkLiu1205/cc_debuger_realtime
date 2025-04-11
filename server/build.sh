GOOS=js
GOARCH=wasm
go env -w GOOS=js GOARCH=wasm
go build -o server.wasm
echo Build server.wasm complete