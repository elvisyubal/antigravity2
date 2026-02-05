@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║     GENERADOR DE PAQUETE DE DISTRIBUCION - BOTICA J^&M       ║
echo ║                      Versión 2.0                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Configuración de rutas
set PROYECTO=C:\Users\ELVIS\Botica_JM
set INSTALADORES=%PROYECTO%\Instaladores
set ZIP_NOMBRE=Botica_JM_Instalador.zip

cd /d %PROYECTO%

echo [1/6] Compilando SERVIDOR (Backend)...
echo ─────────────────────────────────────
cd /d %PROYECTO%\server
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al compilar el servidor.
    pause
    exit /b 1
)
echo [OK] Servidor compilado.
echo.

echo [2/6] Compilando CLIENTE (Frontend)...
echo ─────────────────────────────────────
cd /d %PROYECTO%\client
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al compilar el cliente.
    pause
    exit /b 1
)
echo [OK] Cliente compilado.
echo.

echo [3/6] Limpiando carpeta de instaladores anterior...
echo ─────────────────────────────────────────────────
cd /d %PROYECTO%
if exist "%INSTALADORES%\Botica_JM" rmdir /S /Q "%INSTALADORES%\Botica_JM"
if not exist "%INSTALADORES%" mkdir "%INSTALADORES%"
mkdir "%INSTALADORES%\Botica_JM"
echo [OK] Carpeta limpiada.
echo.

echo [4/6] Copiando archivos del proyecto...
echo ──────────────────────────────────────
robocopy "%PROYECTO%" "%INSTALADORES%\Botica_JM" /E /XD node_modules .git dist Instaladores /XF .env *.log exclude.txt PLAN_DESPLIEGUE_PRODUCCION.md CREAR_PAQUETE.bat Botica_JM_Instalador.zip /NFL /NDL /NJH /NJS /NC /NS
echo [OK] Archivos copiados.
echo.

echo [5/6] Creando archivos de configuración de ejemplo...
echo ────────────────────────────────────────────────────

REM Crear .env.example para servidor
(
echo # Configuración del Servidor - Botica J^&M
echo # =========================================
echo.
echo DATABASE_URL="postgresql://postgres:BoticaJM2025!@localhost:5432/botica_jm?schema=public"
echo JWT_SECRET="Botica_JM_SecretKey_2025_Produccion_Farmacia"
echo PORT=3001
) > "%INSTALADORES%\Botica_JM\server\.env.example"

REM Crear .env.example para cliente
(
echo # Configuración del Cliente - Botica J^&M
echo # =======================================
echo.
echo VITE_API_URL=http://localhost:3001/api
) > "%INSTALADORES%\Botica_JM\client\.env.example"

REM Copiar scripts de instalación
copy "%PROYECTO%\PLAN_DESPLIEGUE_PRODUCCION.md" "%INSTALADORES%\LEEME.md" >nul

REM Crear INSTALAR.bat
(
echo @echo off
echo echo ==========================================
echo echo    INSTALADOR BOTICA J^&M
echo echo ==========================================
echo echo.
echo node --version ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     echo [ERROR] Node.js no está instalado.
echo     pause
echo     exit /b 1
echo ^)
echo echo [OK] Node.js detectado.
echo set DESTINO=C:\Sistemas\Botica_JM
echo if not exist "C:\Sistemas" mkdir "C:\Sistemas"
echo xcopy /E /I /Y "Botica_JM" "%%DESTINO%%"
echo copy "%%DESTINO%%\server\.env.example" "%%DESTINO%%\server\.env"
echo copy "%%DESTINO%%\client\.env.example" "%%DESTINO%%\client\.env"
echo cd /d "%%DESTINO%%\server"
echo call npm install
echo call npx prisma generate
echo call npx prisma migrate deploy
echo call npm run build
echo cd /d "%%DESTINO%%\client"
echo call npm install
echo call npm run build
echo echo.
echo echo INSTALACION COMPLETADA
echo echo Ejecute INICIAR_SERVICIOS.bat
echo pause
) > "%INSTALADORES%\INSTALAR.bat"

REM Crear INICIAR_SERVICIOS.bat
(
echo @echo off
echo echo Iniciando servicios...
echo pm2 --version ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 npm install -g pm2 serve pm2-windows-startup
echo cd /d "C:\Sistemas\Botica_JM\server"
echo pm2 start dist/index.js --name "botica-backend"
echo cd /d "C:\Sistemas\Botica_JM\client"
echo pm2 serve dist 5173 --name "botica-frontend" --spa
echo pm2-startup install
echo pm2 save
echo pm2 list
echo echo Sistema en: http://localhost:5173
echo pause
) > "%INSTALADORES%\INICIAR_SERVICIOS.bat"

echo [OK] Archivos de configuración creados.
echo.

echo [6/6] Creando archivo ZIP...
echo ───────────────────────────
cd /d %PROYECTO%
if exist "%ZIP_NOMBRE%" del "%ZIP_NOMBRE%"
powershell -Command "Compress-Archive -Path '%INSTALADORES%\*' -DestinationPath '%ZIP_NOMBRE%' -Force"
echo [OK] ZIP creado.
echo.

REM Mostrar información del ZIP
for %%A in ("%ZIP_NOMBRE%") do (
    set TAMANIO=%%~zA
)
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  PAQUETE GENERADO                            ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Archivo: %ZIP_NOMBRE%
echo ║  Ubicación: %PROYECTO%
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Contenido del paquete:
echo   - INSTALAR.bat
echo   - INICIAR_SERVICIOS.bat
echo   - LEEME.md
echo   - Botica_JM/ (código fuente)
echo.
echo Listo para copiar a USB y llevar al cliente.
echo.
pause
