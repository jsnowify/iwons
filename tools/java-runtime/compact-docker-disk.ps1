# Run from an elevated PowerShell after quitting Docker Desktop.
# Compacts unused blocks; does not delete images, containers, volumes or files.
$ErrorActionPreference = 'Stop'
$taskIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$taskPrincipal = New-Object Security.Principal.WindowsPrincipal($taskIdentity)
if (-not $taskPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Windows requires Administrator privileges to compact the Docker virtual disk.'
}
if (Get-Process -Name 'Docker Desktop','com.docker.backend' -ErrorAction SilentlyContinue) {
    throw 'Quit Docker Desktop before compacting its virtual disk.'
}
& wsl --terminate docker-desktop
$taskDisk = Join-Path $env:LOCALAPPDATA 'Docker\wsl\disk\docker_data.vhdx'
if (-not (Test-Path -LiteralPath $taskDisk -PathType Leaf)) {
    throw "Docker data disk was not found at $taskDisk"
}
$taskDisk = (Resolve-Path -LiteralPath $taskDisk).Path
$taskScript = Join-Path $PSScriptRoot '..\..\artifacts\judge0-local\compact-diskpart.txt'
New-Item -ItemType Directory -Path (Split-Path -Parent $taskScript) -Force | Out-Null
@"
select vdisk file="$taskDisk"
attach vdisk readonly
compact vdisk
detach vdisk
exit
"@ | Set-Content -LiteralPath $taskScript -Encoding ASCII
& diskpart /s $taskScript
if ($LASTEXITCODE -ne 0) { throw 'Disk compaction did not complete.' }
Get-PSDrive -Name C | Select-Object Name,Free
