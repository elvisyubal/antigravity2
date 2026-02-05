@echo off
echo Iniciando servicios...
pm2 --version >nul 2>&1
if %errorlevel% neq 0 npm install -g pm2 serve pm2-windows-startup
cd /d "C:\Sistemas\Botica_JM\server"
pm2 start dist/index.js --name "botica-backend"
cd /d "C:\Sistemas\Botica_JM\client"
pm2 serve dist 5173 --name "botica-frontend" --spa
pm2-startup install
pm2 save
pm2 list
echo Sistema en: http://localhost:5173
pause
