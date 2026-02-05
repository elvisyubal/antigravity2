# 🚀 Plan de Despliegue en Producción - Botica J&M
**Versión:** 2.0  
**Fecha:** Febrero 2025

---

## 📋 Resumen del Sistema

Sistema de Punto de Venta completo para farmacia con:
- ✅ Gestión de productos e inventario
- ✅ Control de lotes y vencimientos
- ✅ Punto de venta (POS) con múltiples métodos de pago
- ✅ Gestión de clientes y créditos
- ✅ Control de caja (apertura/cierre)
- ✅ Reportes y estadísticas
- ✅ Sistema de permisos personalizados
- ✅ Impresión de tickets para ticketera 58mm
- ✅ Importación masiva desde Excel

---

## 🖥️ REQUISITOS DEL SISTEMA

### Hardware Mínimo
| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| Procesador | Intel Core i3 | Intel Core i5 |
| RAM | 4GB | 8GB |
| Almacenamiento | 50GB HDD | 120GB SSD |
| Impresora | Térmica 58mm | Térmica 58mm USB |

### Software Requerido
1. **Windows 10/11** (64 bits)
2. **Node.js v18 LTS** - [Descargar](https://nodejs.org/)
3. **PostgreSQL v14+** - [Descargar](https://www.postgresql.org/download/windows/)
4. **Git** (opcional para actualizaciones)

---

## 📦 PASO 1: Preparar Archivos de Instalación

Antes de ir al cliente, prepara una carpeta con:

```
📁 Instaladores/
├── 📄 node-v18.x.x-x64.msi
├── 📄 postgresql-14-windows-x64.exe
└── 📁 Botica_JM/  (código del proyecto)
```

### Exportar el proyecto limpio:
```powershell
# En tu PC de desarrollo
cd c:\Users\ELVIS\Botica_JM

# Copiar todo excepto node_modules
xcopy /E /I /EXCLUDE:exclude.txt . "D:\Instaladores\Botica_JM"
```

Crear archivo `exclude.txt`:
```
node_modules
.git
dist
```

---

## 💾 PASO 2: Instalación de Software Base

### 2.1 Instalar Node.js
1. Ejecutar `node-v18.x.x-x64.msi`
2. Seguir el asistente (siguiente, siguiente...)
3. Verificar: `node --version` → debe mostrar v18.x.x

### 2.2 Instalar PostgreSQL
1. Ejecutar instalador de PostgreSQL
2. **Contraseña para postgres:** `BoticaJM2025!` (anotar)
3. Puerto: `5432` (dejar por defecto)
4. Locale: `Spanish, Peru`
5. Completar instalación

### 2.3 Configurar PowerShell (si hay error de scripts)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Presionar 'S' para confirmar
```

---

## 🗄️ PASO 3: Crear Base de Datos

### 3.1 Abrir pgAdmin 4
1. Buscar "pgAdmin 4" en el menú de Windows
2. Ingresar contraseña master (crear una si es primera vez)

### 3.2 Crear la base de datos
1. Click derecho en "Databases" → "Create" → "Database..."
2. Nombre: `botica_jm`
3. Owner: `postgres`
4. Click "Save"

---

## 📂 PASO 4: Copiar y Configurar Proyecto

### 4.1 Copiar archivos
```powershell
# Crear carpeta de instalación
mkdir C:\Sistemas
xcopy /E "D:\Instaladores\Botica_JM" "C:\Sistemas\Botica_JM\"
```

### 4.2 Configurar archivo .env del servidor
Crear archivo `C:\Sistemas\Botica_JM\server\.env`:
```env
DATABASE_URL="postgresql://postgres:BoticaJM2025!@localhost:5432/botica_jm?schema=public"
JWT_SECRET="Botica_JM_SecretKey_2025_Produccion_Farmacia"
PORT=3001
```

### 4.3 Configurar archivo .env del cliente
Crear archivo `C:\Sistemas\Botica_JM\client\.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🔧 PASO 5: Instalar Dependencias y Compilar

### 5.1 Backend (Servidor)
```powershell
cd C:\Sistemas\Botica_JM\server
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 5.2 Frontend (Cliente)
```powershell
cd C:\Sistemas\Botica_JM\client
npm install
npm run build
```

---

## 🌐 PASO 6: Configurar PM2 (Gestor de Procesos)

### 6.1 Instalar PM2 y dependencias globales
```powershell
npm install -g pm2
npm install -g serve
npm install -g pm2-windows-startup
```

### 6.2 Iniciar servicios
```powershell
cd C:\Sistemas\Botica_JM\server
pm2 start dist/index.js --name "botica-backend"

cd C:\Sistemas\Botica_JM\client
pm2 serve dist 5173 --name "botica-frontend" --spa
```

### 6.3 Verificar que todo esté corriendo
```powershell
pm2 list
```
Debe mostrar ambos procesos en estado `online` (verde).

### 6.4 Configurar inicio automático con Windows
```powershell
pm2-startup install
pm2 save
```

---

## ✅ PASO 7: Verificación Final

### 7.1 Probar el sistema
1. Abrir navegador: `http://localhost:5173`
2. Iniciar sesión:
   - Usuario: `admin`
   - Contraseña: `admin123`

### 7.2 Checklist de verificación
- [ ] Login funciona correctamente
- [ ] Dashboard carga con estadísticas
- [ ] Se pueden agregar productos
- [ ] POS procesa ventas
- [ ] Ticket imprime correctamente en ticketera 58mm
- [ ] Apertura/cierre de caja funciona
- [ ] Reportes se generan correctamente

---

## 🖨️ PASO 8: Configurar Impresora Térmica

### 8.1 Instalar driver de la impresora
1. Conectar impresora USB
2. Windows debería detectarla automáticamente
3. Si no, instalar driver del fabricante

### 8.2 Configurar como impresora predeterminada
1. Ir a Configuración → Dispositivos → Impresoras
2. Seleccionar la impresora térmica
3. Click en "Administrar" → "Establecer como predeterminada"

### 8.3 Configurar tamaño del papel
1. Click derecho en la impresora → Preferencias de impresión
2. Tamaño de papel: `58mm x Continuo` o similar
3. Orientación: Vertical

---

## 🔐 PASO 9: Configuración de Seguridad

### 9.1 Cambiar contraseña del admin
1. Ir a Configuración → Usuarios
2. Editar usuario "admin"
3. Cambiar contraseña por una segura

### 9.2 Crear usuarios según roles
| Usuario | Rol | Permisos |
|---------|-----|----------|
| admin | ADMIN | Todos |
| cajero1 | CAJERO | Ventas, Caja |
| almacen | ALMACENERO | Productos, Inventario |

---

## 💾 PASO 10: Configurar Backups Automáticos

### 10.1 Crear carpeta de backups
```powershell
mkdir C:\Backups\BoticaJM
```

### 10.2 Crear script de backup
Crear archivo `C:\Sistemas\backup_botica.bat`:
```batch
@echo off
set PGPASSWORD=BoticaJM2025!
set fecha=%date:~6,4%%date:~3,2%%date:~0,2%
"C:\Program Files\PostgreSQL\14\bin\pg_dump" -U postgres botica_jm > "C:\Backups\BoticaJM\backup_%fecha%.sql"
echo Backup completado: %fecha%
```

### 10.3 Programar tarea en Windows
1. Abrir "Programador de tareas"
2. Crear tarea básica: "Backup Botica JM"
3. Ejecutar: Diariamente a las 23:00
4. Acción: Iniciar programa → `C:\Sistemas\backup_botica.bat`

---

## 📞 Soporte y Mantenimiento

### Comandos útiles de PM2
```powershell
pm2 list              # Ver estado de servicios
pm2 logs              # Ver logs en tiempo real
pm2 restart all       # Reiniciar todo
pm2 stop all          # Detener todo
pm2 start all         # Iniciar todo
```

### Para actualizar el sistema
```powershell
pm2 stop all
# Copiar nuevos archivos del proyecto
cd C:\Sistemas\Botica_JM\server
npm run build
cd ..\client
npm run build
pm2 restart all
```

### Restaurar un backup
```powershell
psql -U postgres -d botica_jm -f "C:\Backups\BoticaJM\backup_20250205.sql"
```

---

## 📌 Datos del Cliente

| Campo | Valor |
|-------|-------|
| Nombre Negocio | Botica J&M |
| Dirección | _________________ |
| RUC | _________________ |
| Teléfono | _________________ |
| Fecha Instalación | _________________ |
| Técnico | _________________ |

---

**✅ Instalación completada exitosamente**
