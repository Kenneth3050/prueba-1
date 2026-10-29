[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStreamWithContentType,Windows.Storage.Streams,ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.IInputStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $type) {
  $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
  if (-not $t.Wait(5000)) { return $null }
  $t.Result
}
$script:err = ''
$ext = [System.IO.WindowsRuntimeStreamExtensions]
$mRead = $ext.GetMethods() | Where-Object { $_.Name -eq 'AsStreamForRead' -and $_.GetParameters().Count -eq 1 } | Select-Object -First 1
$mAs = $ext.GetMethods() | Where-Object { $_.Name -eq 'AsStream' -and $_.GetParameters().Count -eq 1 } | Select-Object -First 1
function ReadAll($method, $rs) {
  $st = $method.Invoke($null, @($rs))
  $ms = New-Object System.IO.MemoryStream
  $st.CopyTo($ms)
  return $ms.ToArray()
}
function GetThumb($p) {
  try {
    $ref = $p.Thumbnail
    if ($ref -eq $null) { $script:err = 'sin miniatura'; return '' }
    $rs = Await ($ref.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
    if ($rs -eq $null) { $script:err = 'OpenReadAsync nulo'; return '' }
    $bytes = $null
    try { $bytes = ReadAll $mRead $rs } catch { $script:err = 'A:' + $_.Exception.Message }
    if ($bytes -eq $null -or $bytes.Length -lt 100) {
      try { $bytes = ReadAll $mAs $rs } catch { $script:err = $script:err + ' B:' + $_.Exception.Message }
    }
    if ($bytes -eq $null -or $bytes.Length -lt 100 -or $bytes.Length -gt 3000000) { return '' }
    $mime = 'image/jpeg'
    if ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50) { $mime = 'image/png' }
    elseif ($bytes[0] -eq 0x52 -and $bytes[1] -eq 0x49) { $mime = 'image/webp' }
    elseif ($bytes[0] -eq 0x47 -and $bytes[1] -eq 0x49) { $mime = 'image/gif' }
    return ('data:' + $mime + ';base64,' + [Convert]::ToBase64String($bytes))
  } catch { $script:err = 'X:' + $_.Exception.Message; return '' }
}
$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
$lastKey = ''; $tries = 0; $lastLen = 0
while ($true) {
  try {
    $s = $mgr.GetCurrentSession()
    if ($s -ne $null) {
      $p = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
      $st = [int]$s.GetPlaybackInfo().PlaybackStatus
      $tl = $s.GetTimelineProperties()
      $o = @{ t = [string]$p.Title; a = [string]$p.Artist; s = $st; p = [int]$tl.Position.TotalSeconds; d = [int]($tl.EndTime.TotalSeconds - $tl.StartTime.TotalSeconds); src = [string]$s.SourceAppUserModelId }
      $key = $o.t + '|' + $o.a
      if ($key -ne $lastKey) { $lastKey = $key; $tries = 0; $lastLen = 0 }
      if ($tries -lt 25) {
        $tries++
        $img = GetThumb $p
        if ($img -ne '' -and $img.Length -ne $lastLen) {
          $lastLen = $img.Length
          $o.img = $img
          $o.dbg = 'portada ok (' + $img.Length + ' caracteres) intento ' + $tries
        } elseif ($tries -eq 25 -and $lastLen -eq 0) {
          $o.dbg = 'portada no disponible: ' + $script:err
        }
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
