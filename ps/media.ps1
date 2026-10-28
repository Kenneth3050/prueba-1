[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStreamWithContentType,Windows.Storage.Streams,ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $type) {
  $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
  if (-not $t.Wait(5000)) { return $null }
  $t.Result
}
function GetThumb($p) {
  try {
    if ($p.Thumbnail -eq $null) { return '' }
    $rs = Await ($p.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
    if ($rs -eq $null) { return '' }
    $st = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($rs)
    $ms = New-Object System.IO.MemoryStream
    $st.CopyTo($ms)
    $mime = $rs.ContentType
    $rs.Dispose()
    if ($ms.Length -gt 3000000 -or $ms.Length -lt 100) { return '' }
    return ('data:' + $mime + ';base64,' + [Convert]::ToBase64String($ms.ToArray()))
  } catch { return '' }
}
$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
$lastKey = ''; $sent = $false; $tries = 0
while ($true) {
  try {
    $s = $mgr.GetCurrentSession()
    if ($s -ne $null) {
      $p = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
      $st = [int]$s.GetPlaybackInfo().PlaybackStatus
      $tl = $s.GetTimelineProperties()
      $o = @{ t = [string]$p.Title; a = [string]$p.Artist; s = $st; p = [int]$tl.Position.TotalSeconds; d = [int]($tl.EndTime.TotalSeconds - $tl.StartTime.TotalSeconds) }
      $key = $o.t + '|' + $o.a
      if ($key -ne $lastKey) { $lastKey = $key; $sent = $false; $tries = 0 }
      if (-not $sent) {
        $img = GetThumb $p
        $tries++
        if ($img -ne '' -or $tries -ge 6) { $o.img = $img; $sent = $true }
      }
      [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress))
    } else {
      $lastKey = ''
      [Console]::Out.WriteLine('{"none":1}')
    }
  } catch {
    [Console]::Out.WriteLine('{"none":1}')
  }
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 1000
}
