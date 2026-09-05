@echo off
start "Git Forums API" /D "%~dp0backend" cmd /k "C:\Users\binfi\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd run dev"
start "Git Forums Web" /D "%~dp0frontend" cmd /k "C:\Users\binfi\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd run dev"
