# Firebase Development Environment Startup Script
# STRICT RULE: Always check before starting any process

Write-Host "🚀 Firebase Development Environment Startup" -ForegroundColor Cyan
Write-Host "⚠️  Following STRICT RULE: Check before starting anything!" -ForegroundColor Yellow
Write-Host ""

# Step 1: Load environment config
Write-Host "Step 1: Loading environment configuration..." -ForegroundColor Green

# Load environment variables from .env.development
$envFile = ".env.development"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Loaded environment config from $envFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: $envFile not found, using default values" -ForegroundColor Yellow
}

# Get ports from environment variables
$appPort = $env:VITE_DEV_PORT ?? "5173"
$emulatorUiPort = $env:VITE_EMULATOR_UI_PORT ?? "4000"
$authPort = $env:VITE_AUTH_EMULATOR_PORT ?? "9099"
$firestorePort = $env:VITE_FIRESTORE_EMULATOR_PORT ?? "8080"
$storagePort = $env:VITE_STORAGE_EMULATOR_PORT ?? "9199"

# Step 2: Check if Firebase emulators are already running
Write-Host ""
Write-Host "Step 2: Checking if Firebase emulators are already running..." -ForegroundColor Green
$emulatorPorts = netstat -an | findstr ":$authPort :$firestorePort :$storagePort :$emulatorUiPort"

if ($emulatorPorts) {
    Write-Host "✅ Firebase emulators are already running!" -ForegroundColor Green
    Write-Host "   Detected ports: $($emulatorPorts -join ', ')" -ForegroundColor Gray
    Write-Host "   ❌ NOT starting emulators again (following strict rule)" -ForegroundColor Yellow
} else {
    Write-Host "✅ No emulators detected. Safe to start emulators." -ForegroundColor Green
    Write-Host "🔄 Starting Firebase emulators..." -ForegroundColor Cyan
    
    # Start emulators in background
    Start-Process powershell -ArgumentList "-Command", "firebase emulators:start --only auth,firestore,storage,ui" -WindowStyle Normal
    
    Write-Host "⏳ Waiting 10 seconds for emulators to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Step 3: Check if Vite dev server is already running  
Write-Host ""
Write-Host "Step 3: Checking if Vite dev server is already running..." -ForegroundColor Green
$vitePort = netstat -an | findstr ":$appPort"

if ($vitePort) {
    Write-Host "✅ Vite dev server is already running!" -ForegroundColor Green
    Write-Host "   Detected: $vitePort" -ForegroundColor Gray
    Write-Host "   ❌ NOT starting npm run dev again (following strict rule)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Port $appPort is free. Safe to start dev server." -ForegroundColor Green
    Write-Host "🔄 Starting Vite dev server..." -ForegroundColor Cyan
    
    # Start dev server
    Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Normal
    
    Write-Host "⏳ Waiting 5 seconds for dev server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Step 3: Load environment variables and verify all services
Write-Host ""
Write-Host "Step 3: Loading environment config and verifying services..." -ForegroundColor Green

# Load environment variables from .env.development
$envFile = ".env.development"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Loaded environment config from $envFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: $envFile not found, using default values" -ForegroundColor Yellow
}

# Use environment variables for URLs
$appPort = $env:VITE_DEV_PORT ?? "5173"
$emulatorUiPort = $env:VITE_EMULATOR_UI_PORT ?? "4000"
$authPort = $env:VITE_AUTH_EMULATOR_PORT ?? "9099"
$firestorePort = $env:VITE_FIRESTORE_EMULATOR_PORT ?? "8080"
$storagePort = $env:VITE_STORAGE_EMULATOR_PORT ?? "9199"

$urls = @(
    @{Name="App"; Url="http://localhost:$appPort"},
    @{Name="Emulator UI"; Url="http://localhost:$emulatorUiPort"},
    @{Name="Auth Emulator"; Url="http://localhost:$authPort"},
    @{Name="Firestore Emulator"; Url="http://localhost:$firestorePort"},
    @{Name="Storage Emulator"; Url="http://localhost:$storagePort"}
)

foreach ($service in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 3 -UseBasicParsing
        Write-Host "✅ $($service.Name): $($service.Url)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($service.Name): $($service.Url) - Not accessible" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Development environment check complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Open browser: http://localhost:$appPort" -ForegroundColor White
Write-Host "   2. Open console and run: window.createTestUsers()" -ForegroundColor White
Write-Host "   3. Test authentication with provided test accounts" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Available URLs:" -ForegroundColor Yellow
Write-Host "   App:        http://localhost:$appPort" -ForegroundColor White
Write-Host "   Emulator:   http://localhost:$emulatorUiPort" -ForegroundColor White
Write-Host "   Auth:       http://localhost:$authPort" -ForegroundColor White
Write-Host "   Firestore:  http://localhost:$firestorePort" -ForegroundColor White
Write-Host "   Storage:    http://localhost:$storagePort" -ForegroundColor White
