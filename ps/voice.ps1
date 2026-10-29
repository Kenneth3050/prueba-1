param([string]$pre = 'es')
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$script:eng = $null
function Emit($o) { [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress)); [Console]::Out.Flush() }
function Init($p) {
  try {
    $all = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()
    $names = ($all | ForEach-Object { $_.Culture.Name }) -join ','
    $info = $all | Where-Object { $_.Culture.Name -like ($p + '*') } | Select-Object -First 1
    $ok = $true
    if ($info -eq $null) { $info = $all | Select-Object -First 1; $ok = $false }
    if ($info -eq $null) { Emit @{ err = 'norecognizer' }; return }
    if ($script:eng -ne $null) { $script:eng.Dispose() }
    $script:eng = New-Object System.Speech.Recognition.SpeechRecognitionEngine($info)
    $script:eng.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
    $script:eng.SetInputToDefaultAudioDevice()
    Emit @{ ready = $info.Culture.Name; match = $ok; all = $names }
  } catch { Emit @{ err = 'init: ' + $_.Exception.Message } }
}
Init $pre
while (($l = [Console]::In.ReadLine()) -ne $null) {
  $p = $l.Trim().Split(' ')
  try {
    if ($p[0] -eq 'lang') { Init $p[1] }
    elseif ($p[0] -eq 'listen') {
      if ($script:eng -eq $null) { Emit @{ err = 'norecognizer' }; continue }
      $secs = 7
      if ($p.Length -gt 1) { $secs = [int]$p[1] }
      $r = $script:eng.Recognize([TimeSpan]::FromSeconds($secs))
      if ($r -ne $null) { Emit @{ heard = [string]$r.Text; conf = [Math]::Round($r.Confidence, 2) } } else { Emit @{ heard = '' } }
    }
  } catch { Emit @{ err = 'listen: ' + $_.Exception.Message } }
}
