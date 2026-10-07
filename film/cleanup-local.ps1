param([Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f]{40}$')][string]$Commit)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$gitRoot = $root.Replace('\','/')
$artifact = 'film/output/political-sculptures-105s.mp4'
$report = Get-Content -LiteralPath (Join-Path $root 'film/output/verification.json') -Raw | ConvertFrom-Json
$head = & git -C $root -c "safe.directory=$gitRoot" rev-parse HEAD
if ($LASTEXITCODE -ne 0 -or $head.Trim() -ne $Commit) { throw 'Unexpected local commit' }
$remote = & git -C $root -c "safe.directory=$gitRoot" ls-remote origin refs/heads/main
if ($LASTEXITCODE -ne 0 -or ($remote -split '\s+')[0] -ne $Commit) { throw 'GitHub main does not match the verified commit' }
if (Test-Path -LiteralPath (Join-Path $root $artifact)) {
    $localHash = (Get-FileHash -LiteralPath (Join-Path $root $artifact) -Algorithm SHA256).Hash.ToLower()
    if ($localHash -ne $report.sha256) { throw 'Local video differs from the verified video' }
}

# Stream the actual GitHub artifact through SHA-256 without saving another video copy.
Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [TimeSpan]::FromMinutes(5)
$url = "https://raw.githubusercontent.com/karthiksrikumar/personalwebsite/$Commit/$artifact"
try {
    $response = $client.GetAsync($url, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
    $response.EnsureSuccessStatusCode() | Out-Null
    $stream = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try { $remoteHash = ([BitConverter]::ToString($hasher.ComputeHash($stream))).Replace('-','').ToLower() }
    finally { $stream.Dispose(); $hasher.Dispose() }
} finally { $client.Dispose() }
if ($remoteHash -ne $report.sha256) { throw 'GitHub video checksum differs; no local files removed' }

# Keep the committed video on GitHub while intentionally omitting its working-tree copy.
& git -C $root -c "safe.directory=$gitRoot" update-index --skip-worktree -- $artifact
if ($LASTEXITCODE -ne 0) { throw 'Could not mark the video as intentionally absent' }
$targets = @(
    $artifact, 'film/output/political-sculptures-90s.mp4', 'film/output/political-sculptures-75s.mp4', 'film/output/political-sculptures-60s.mp4',
    '.cache/film-frames', '.cache/film-preview', '.cache/film75-frames', '.cache/film75-preview',
    '.cache/film90-frames', '.cache/film90-preview', '.cache/film90-score.wav',
    '.cache/film90-boundaries.jpg',
    '.cache/film105-frames', '.cache/film105-preview', '.cache/film105-score.wav',
    '.cache/film-score.wav', '.cache/film75-score.wav', '.cache/film-contact.jpg', '.cache/film75-contact.jpg',
    '.cache/film-tools'
)
[long]$recovered = 0
foreach ($relative in $targets) {
    $target = [IO.Path]::GetFullPath((Join-Path $root $relative))
    if (-not $target.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing path outside workspace: $target"
    }
    if (Test-Path -LiteralPath $target) {
        $item = Get-Item -LiteralPath $target
        if ($item.PSIsContainer) {
            if (-not $target.StartsWith((Join-Path $root '.cache') + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Recursive cleanup restricted to film cache directories' }
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing reparse-point directory' }
            $recovered += (Get-ChildItem -LiteralPath $target -Recurse -File | Measure-Object -Property Length -Sum).Sum
            Remove-Item -LiteralPath $target -Recurse -Force
        } else {
            $recovered += $item.Length
            Remove-Item -LiteralPath $target -Force
        }
    }
}
[PSCustomObject]@{ RemoteVideo=$url; SHA256=$remoteHash; RecoveredBytes=$recovered; RecoveredGiB=[Math]::Round($recovered/1GB,3) } | ConvertTo-Json
