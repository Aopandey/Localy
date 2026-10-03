param([ValidateSet('dev', 'build', 'start', 'check', 'test')][string]$Mode = 'dev')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw 'Install Node.js 24 LTS, then reopen the terminal.' }
$nodePath = $nodeCommand.Source
$pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm -ErrorAction SilentlyContinue
$bundledPnpm = Join-Path (Split-Path (Split-Path $nodePath -Parent) -Parent) 'node_modules\pnpm\bin\pnpm.cjs'
function Run-PackageManager([string[]]$Arguments) {
  if ($pnpmCommand) { & $pnpmCommand.Source @Arguments }
  elseif (Test-Path -LiteralPath $bundledPnpm) { & $nodePath $bundledPnpm @Arguments }
  elseif ($npmCommand) { & $npmCommand.Source @Arguments }
  else { throw 'Install Node.js with npm or install pnpm to run Localy.' }
  if ($LASTEXITCODE -ne 0) { throw "Package command failed with exit code $LASTEXITCODE." }
}
if (-not (Test-Path -LiteralPath 'node_modules\next') -or -not (Test-Path -LiteralPath 'node_modules\@supabase\supabase-js')) { Run-PackageManager @('install') }
if ($Mode -eq 'check') {
  Run-PackageManager @('run', 'lint')
  Run-PackageManager @('run', 'typecheck')
} elseif ($Mode -eq 'test') { Run-PackageManager @('run', 'test:e2e') }
else { Run-PackageManager @('run', $Mode) }
