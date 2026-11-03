param([string]$ProjectsRoot = (Split-Path $PSScriptRoot -Parent | Split-Path -Parent))
$ErrorActionPreference = 'Stop'
$portfolioRoot = Split-Path $PSScriptRoot -Parent
$exports = @(
    @{ Name = 'relay'; Directory = 'web'; Script = 'build:demo'; Output = 'web/dist-demo' },
    @{ Name = 'split'; Directory = ''; Script = 'build:demo'; Output = 'dist-demo' },
    @{ Name = 'image-desk'; Directory = ''; Script = 'build'; Output = 'dist' },
    @{ Name = 'overlap'; Directory = ''; Script = 'build'; Output = 'dist' }
)
foreach ($project in $exports) {
    $projectRoot = Join-Path $ProjectsRoot $project.Name
    $previousPortfolioUrl = $env:VITE_PORTFOLIO_URL
    $env:VITE_PORTFOLIO_URL = '../../#projects'
    $previousSourceUrl = $env:VITE_SOURCE_URL
    if ($project.Name -eq 'relay') { $env:VITE_SOURCE_URL = '../../assets/downloads/relay-source.zip' }
    Push-Location (Join-Path $projectRoot $project.Directory)
    try {
        npm run $project.Script
        if ($LASTEXITCODE -ne 0) { throw "Build failed: $($project.Name)" }
    } finally { Pop-Location; $env:VITE_SOURCE_URL = $previousSourceUrl; $env:VITE_PORTFOLIO_URL = $previousPortfolioUrl }
    $destination = [IO.Path]::GetFullPath((Join-Path $portfolioRoot "demo/$($project.Name)"))
    $allowedRoot = [IO.Path]::GetFullPath((Join-Path $portfolioRoot 'demo')) + [IO.Path]::DirectorySeparatorChar
    if (-not $destination.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid demo destination.' }
    if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Recurse -Force }
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Copy-Item -Path (Join-Path $projectRoot "$($project.Output)/*") -Destination $destination -Recurse
}
python (Join-Path $PSScriptRoot 'package-relay.py') (Join-Path $ProjectsRoot 'relay')
if ($LASTEXITCODE -ne 0) { throw 'Relay source packaging failed.' }
