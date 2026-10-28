[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $type) {
  $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
  $t.Wait(-1) | Out-Null
  $t.Result
}
$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
while ($true) {
  try {
    $s = $mgr.GetCurrentSession()
    if ($s -ne $null) {
      $p = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
      $st = [int]$s.GetPlaybackInfo().PlaybackStatus
      $tl = $s.GetTimelineProperties()
      $o = @{ t = [string]$p.Title; a = [string]$p.Artist; s = $st; p = [int]$tl.Position.TotalSeconds; d = [int]($tl.EndTime.TotalSeconds - $tl.StartTime.TotalSeconds) }
      [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress))
    } else {
      [Console]::Out.WriteLine('{"none":1}')
    }
  } catch {
    [Console]::Out.WriteLine('{"none":1}')
  }
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 1000
}
