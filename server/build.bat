@echo off


rem Build for Windows
set GOOS=windows
set GOARCH=amd64
go build -o server.exe
echo Build Windows server.exe success

rem Build for macOS
set GOOS=darwin
set GOARCH=amd64
go build -o server

echo Build macOS server success

rem Build for Linux
set GOOS=linux
set GOARCH=amd64
go build -o server-linux

echo Build Linux server-linux success

