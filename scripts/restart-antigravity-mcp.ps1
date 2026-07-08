# Restart Antigravity so Google Cloud Data Agent Kit recreates MCP named pipes.
# Run from a normal PowerShell window (outside Cursor if hooks block shell).

$ErrorActionPreference = "Continue"
$Proxy = "C:\Users\SysMigrator\.antigravity-ide\extensions\googlecloudtools.datacloud-0.5.2-universal\mcp_servers\cli\mcp_proxy_bundle.js"
$ExeCandidates = @(
  "$env:LOCALAPPDATA\Programs\Antigravity IDE\Antigravity IDE.exe",
  "$env:LOCALAPPDATA\Programs\antigravity\Antigravity.exe",
  "$env:LOCALAPPDATA\Programs\Antigravity\Antigravity.exe"
)
$Pipes = @(
  "datacloud-mcp-notebooks-antigravityide",
  "datacloud-mcp-visualization-antigravityide",
  "datacloud-mcp-notebooks-antigravity",
  "datacloud-mcp-visualization-antigravity"
)

Write-Host ""
Write-Host "=== Restart Antigravity MCP pipes ===" -ForegroundColor Cyan

# 1) Locate IDE binary
$Exe = $ExeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Exe) {
  Write-Host "[FAIL] Antigravity executable not found under LocalAppData\Programs" -ForegroundColor Red
  exit 1
}
Write-Host "[OK] IDE: $Exe"

# 2) Quit running instances cleanly-ish
$procs = Get-Process -Name "Antigravity*","language_server" -ErrorAction SilentlyContinue
if ($procs) {
  Write-Host ("[INFO] Stopping {0} Antigravity-related process(es)..." -f @($procs).Count)
  $procs | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 3
} else {
  Write-Host "[INFO] No Antigravity processes were running"
}

# 3) Confirm proxy + node
if (-not (Test-Path $Proxy)) {
  Write-Host "[FAIL] MCP proxy missing: $Proxy" -ForegroundColor Red
  Write-Host "Reinstall extension: Google Cloud Data Agent Kit"
  exit 1
}
try {
  $nodeV = & node -v 2>$null
  Write-Host "[OK] Node $nodeV"
} catch {
  Write-Host "[FAIL] node is not on PATH" -ForegroundColor Red
  exit 1
}

# 4) Relaunch IDE
Write-Host "[INFO] Launching Antigravity..."
Start-Process -FilePath $Exe
Write-Host "[INFO] Waiting 25s for DataCloud extension host to bind pipes..."
Start-Sleep -Seconds 25

# 5) Probe pipes
$found = @()
foreach ($name in $Pipes) {
  $exists = Test-Path ("\\.\pipe\{0}" -f $name)
  if ($exists) {
    Write-Host ("[OK] Pipe exists: {0}" -f $name) -ForegroundColor Green
    $found += $name
  } else {
    Write-Host ("[WAIT] Pipe missing: {0}" -f $name) -ForegroundColor Yellow
  }
}

if ($found.Count -lt 2) {
  Write-Host "[INFO] Waiting another 20s (extension host can be slow)..."
  Start-Sleep -Seconds 20
  $found = @()
  foreach ($name in $Pipes) {
    if (Test-Path ("\\.\pipe\{0}" -f $name)) {
      Write-Host ("[OK] Pipe exists: {0}" -f $name) -ForegroundColor Green
      $found += $name
    }
  }
}

Write-Host ""
Write-Host "=== Result ===" -ForegroundColor Cyan
if ($found.Count -ge 2) {
  Write-Host "[SUCCESS] DataCloud MCP pipes are listening." -ForegroundColor Green
  Write-Host "In Antigravity:"
  Write-Host "  Settings > Customizations > Installed MCP Servers"
  Write-Host "  Toggle notebooks OFF, wait 3s, toggle ON"
  Write-Host "  Toggle visualization OFF, wait 3s, toggle ON"
  Write-Host "Both should turn green (no ENOENT)."
  exit 0
}

Write-Host "[FAIL] Pipes still missing after restart." -ForegroundColor Red
Write-Host ""
Write-Host "Do this inside Antigravity IDE now:"
Write-Host "  1. Extensions: enable Google Cloud Data Agent Kit"
Write-Host "  2. Ctrl+Shift+P -> Developer: Reload Window"
Write-Host "  3. View -> Output -> Google Cloud Data Agent Kit"
Write-Host "     Wait for: [MCP Registry] Server 'notebooks' listening on IPC socket"
Write-Host "  4. Settings -> Customizations -> toggle notebooks/visualization OFF then ON"
Write-Host "  5. Re-run: powershell -ExecutionPolicy Bypass -File scripts\fix-antigravity-mcp.ps1"
Write-Host ""
Write-Host "Also enable Windows Long Paths (Admin PowerShell, then reboot):"
Write-Host "  Set-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem LongPathsEnabled 1"
exit 2
