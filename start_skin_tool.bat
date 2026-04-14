@echo off
chcp 65001 >nul
title Minecraft Skin Pro Launcher

echo ==================================================
echo   Minecraft Skin Pro 개발 서버를 시작합니다...
echo   (서버가 켜지면 브라우저가 자동으로 열립니다!)
echo ==================================================

:: 2초 대기 후 기본 브라우저로 접속하는 명령어를 백그라운드로 실행
start "" cmd /c "timeout /t 2 > NUL && start http://localhost:5173"

:: Vite 개발 서버 실행
npm run dev

pause
