@echo off
pushd "%~dp0backend"
C:\Users\binfi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\.pnpm\typescript@5.9.3\node_modules\typescript\bin\tsc -p tsconfig.json
if errorlevel 1 exit /b %errorlevel%
popd
pushd "%~dp0frontend"
C:\Users\binfi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc -b
if errorlevel 1 exit /b %errorlevel%
C:\Users\binfi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vite\bin\vite.js build
popd
