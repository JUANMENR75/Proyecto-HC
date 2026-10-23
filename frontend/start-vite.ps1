# Script para asegurar que Vite se ejecute en el puerto 5173
# Este script termina todos los procesos relacionados con Node.js/Vite para liberar todos los puertos, y luego inicia Vite

Write-Host "Checking for Node.js/Vite related processes..." -ForegroundColor Cyan

# Encontrar todos los procesos de Node.js
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found Node.js processes. Checking which ones are related to Vite or development servers..." -ForegroundColor Yellow

    # Obtener todas las conexiones TCP para posibles puertos de servidores de desarrollo
    $devConnections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                     Where-Object { $_.LocalPort -ge 3000 -and $_.LocalPort -le 5999 }

    # Crear una lista para almacenar los IDs de procesos a terminar
    $processesToKill = @()

    # Verificar cada conexión para ver si pertenece a un proceso de Node.js
    foreach ($connection in $devConnections) {
        foreach ($process in $nodeProcesses) {
            if ($connection.OwningProcess -eq $process.Id) {
                $processesToKill += $process.Id
                Write-Host "Found development server on port $($connection.LocalPort) (PID: $($process.Id))" -ForegroundColor Yellow
            }
        }
    }

    # Eliminar duplicados
    $processesToKill = $processesToKill | Select-Object -Unique

    # Terminar todos los procesos identificados
    if ($processesToKill.Count -gt 0) {
        Write-Host "Killing all development server processes..." -ForegroundColor Red
        foreach ($pid in $processesToKill) {
            try {
                Stop-Process -Id $pid -Force
                Write-Host "Process ID $pid terminated successfully." -ForegroundColor Green
            } catch {
                Write-Host "Failed to terminate process ID $pid: $_" -ForegroundColor Red
            }
        }

        # Esperar un momento para asegurar que todos los puertos sean liberados
        Start-Sleep -Seconds 2

        Write-Host "All development server processes terminated." -ForegroundColor Green
    } else {
        Write-Host "No active development server processes found." -ForegroundColor Green
    }
} else {
    Write-Host "No Node.js processes found. All ports should be available." -ForegroundColor Green
}

# Verificar específicamente el puerto 5173 para asegurarse de que esté disponible
$port5173InUse = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port5173InUse) {
    Write-Host "Port 5173 is still in use by process ID: $($port5173InUse.OwningProcess). Attempting to kill it..." -ForegroundColor Yellow
    Stop-Process -Id $port5173InUse.OwningProcess -Force
    Start-Sleep -Seconds 2
    Write-Host "Process terminated." -ForegroundColor Green
} else {
    Write-Host "Port 5173 is available." -ForegroundColor Green
}

# Iniciar Vite en el puerto 5173
Write-Host "Starting Vite on port 5173..." -ForegroundColor Cyan
npm run dev -- --port=5173
