@echo off
rem setlocal

rem Build for Windows
set GOOS=windows
set GOARCH=amd64
go build -o server.exe
echo Build server complete

go env -w GOOS=js GOARCH=wasm
go build -o server.wasm
echo Build server.wasm complete

@REM rem Build for macOS Intel
@REM set GOOS=darwin
@REM set GOARCH=amd64
@REM go build -o server_mac_amd64
@REM echo Build server_mac_amd64 complete

rem Build for macOS M1/M2/M3
set GOOS=darwin
set GOARCH=arm64
go build -o server
echo Build server complete


rem Build for Linux
set GOOS=linux
set GOARCH=arm64
go build -o server_linux

echo Build server_linux complete

rem endlocal
pause