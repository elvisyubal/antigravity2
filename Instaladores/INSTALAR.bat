@echo off
echo ==========================================
echo    INSTALADOR BOTICA J&M
echo ==========================================
echo.
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado.
    pause
    exit /b 1
)
echo [OK] Node.js detectado.
set DESTINO=C:\Sistemas\Botica_JM
if not exist "C:\Sistemas" mkdir "C:\Sistemas"
xcopy /E /I /Y "Botica_JM" "%DESTINO%"
copy "%DESTINO%\server\.env.example" "%DESTINO%\server\.env"
copy "%DESTINO%\client\.env.example" "%DESTINO%\client\.env"
cd /d "%DESTINO%\server"
call npm install
call npx prisma generate
call npx prisma migrate deploy
call npm run build
cd /d "%DESTINO%\client"
call npm install
call npm run build
echo.
echo INSTALACION COMPLETADA
echo Ejecute INICIAR_SERVICIOS.bat
pause
