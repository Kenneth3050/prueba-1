[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$base = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone'
$roots = @($base, ($base + '\NonPackaged'))
while ($true) {
  $act = @()
  foreach ($r in $roots) {
    if (Test-Path $r) {
      foreach ($k in (Get-ChildItem $r -ErrorAction SilentlyContinue)) {
        if ($k.PSChildName -eq 'NonPackaged') { continue }
        $v = Get-ItemProperty $k.PSPath -ErrorAction SilentlyContinue
        if ($v -and $v.LastUsedTimeStart -gt 0 -and $v.LastUsedTimeStop -eq 0) { $act += $k.PSChildName }
      }
    }
  }
  [Console]::Out.WriteLine((@{ apps = @($act) } | ConvertTo-Json -Compress))
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 2000
}
