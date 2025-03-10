@echo off
rem setlocal

rem Build for Windows
set GOOS=windows
set GOARCH=amd64
go build -o server_windows.exe
echo Build server_windows complete

rem Build for macOS Intel
set GOOS=darwin
set GOARCH=amd64
go build -o server_mac_amd64
echo Build server_mac_amd64 complete

rem Build for macOS M1/M2/M3
set GOOS=darwin
set GOARCH=arm64
go build -o server_mac_arm64
echo Build server_mac_arm64 complete


rem Build for Linux
set GOOS=linux
set GOARCH=arm64
go build -o server_linux

echo Build server_linux complete

rem endlocal
pause