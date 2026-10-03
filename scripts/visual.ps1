param([switch]$Update)
# Builds the pinned Playwright image and compares (or with -Update, rewrites) the committed visual baselines.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$shots = Join-Path $root 'tests/visual/__screenshots__'
$results = Join-Path $root 'tests/visual/results'
New-Item -ItemType Directory -Force $shots, $results | Out-Null

docker build -f (Join-Path $root 'docker/visual.Dockerfile') -t design-system-visual $root
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$runArgs = @('run', '--rm', '--name', 'design-system-visual', '--ipc=host',
  '-v', "${shots}:/work/tests/visual/__screenshots__",
  '-v', "${results}:/work/tests/visual/results",
  'design-system-visual')
if ($Update) { $runArgs += '--update-snapshots' }
docker @runArgs
exit $LASTEXITCODE
