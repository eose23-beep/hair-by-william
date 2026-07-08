# Fix Antigravity IDE notebooks + visualization MCP ENOENT pipe errors
# Run: powershell -ExecutionPolicy Bypass -File scripts\fix-antigravity-mcp.ps1

$ErrorActionPreference = "Stop"

$proxyPath = Join-Path $env:USERPROFILE ".antigravity-ide\extensions\googlecloudtools.datacloud-0.5.2-universal\mcp_servers\cli\mcp_proxy_bundle.js"
$mcpConfig = Join-Path $env:USERPROFILE ".gemini\config\mcp_config.json"
$logPath = Join-Path $env:APPDATA "Antigravity IDE\logs"

Write-Host ""
Write-Host "=== Antigravity MCP Diagnostic ===" -ForegroundColor Cyan

if (-not (Test-Path $proxyPath)) {
    $found = Get-ChildItem (Join-Path $env:USERPROFILE ".antigravity-ide\extensions\googlecloudtools.datacloud-*\mcp_servers\cli\mcp_proxy_bundle.js") -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        Write-Host "[WARN] Proxy version path changed. Update mcp_config.json to use:" $found.FullName -ForegroundColor Yellow
        $proxyPath = $found.FullName
    } else {
        Write-Host "[FAIL] Install Google Cloud Data Agent Kit extension in Antigravity IDE." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] MCP proxy bundle found" -ForegroundColor Green
}

$nodeVer = & node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Node.js $nodeVer" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Node.js not on PATH." -ForegroundColor Red
    exit 1
}

$ag = Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue
if ($ag) {
    Write-Host "[OK] Antigravity running ($($ag.Count) process(es))" -ForegroundColor Green
} else {
    Write-Host "[WARN] Antigravity not running. Pipes only exist while IDE + DataCloud are active." -ForegroundColor Yellow
}

$expectedPipes = @(
    "datacloud-mcp-notebooks-antigravityide",
    "datacloud-mcp-visualization-antigravityide"
)
$allPipes = @(Get-ChildItem \\.\pipe\ -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
$missing = @()
foreach ($pipe in $expectedPipes) {
    if ($allPipes -contains $pipe) {
        Write-Host "[OK] Pipe exists: $pipe" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Pipe missing: $pipe" -ForegroundColor Red
        $missing += $pipe
    }
}

$longPaths = (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled
if ($longPaths -eq 1) {
    Write-Host "[OK] Windows long paths enabled" -ForegroundColor Green
} else {
    Write-Host "[WARN] LongPathsEnabled=0. Jupyter may fail. Enable in Admin PowerShell then reboot:" -ForegroundColor Yellow
    Write-Host "Set-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem LongPathsEnabled 1"
}

$latestLog = Get-ChildItem $logPath -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
if ($latestLog) {
    $kitLog = Get-ChildItem (Join-Path $latestLog.FullName "window*\exthost\googlecloudtools.datacloud\Google Cloud Data Agent Kit.log") -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($kitLog) {
        Write-Host ""
        Write-Host "--- Last DataCloud Kit log lines ---" -ForegroundColor DarkGray
        Get-Content $kitLog.FullName -Tail 6
    }
}

Write-Host ""
Write-Host "=== Root cause ===" -ForegroundColor Cyan
Write-Host "ENOENT: MCP proxy cannot find the named pipe. Pipes are created by Google Cloud Data Agent Kit inside Antigravity IDE."

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "=== Fix steps ===" -ForegroundColor Cyan
    Write-Host "1. Extensions: enable Google Cloud Data Agent Kit"
    Write-Host "2. Ctrl+Shift+P -> Developer: Reload Window"
    Write-Host "3. Output panel -> Google Cloud Data Agent Kit -> wait for listening on IPC socket"
    Write-Host "4. Settings -> Customizations -> toggle notebooks OFF, wait 3s, ON"
    Write-Host "5. Repeat for visualization"
    Write-Host "6. Re-run this script"
    Write-Host ""
    Write-Host "If using Antigravity (not Antigravity IDE), pipe suffix is antigravity not antigravityide."
} else {
    Write-Host ""
    Write-Host "[OK] Pipes are live. Toggle MCP servers in Settings if UI shows stale errors." -ForegroundColor Green
}

Write-Host ""
