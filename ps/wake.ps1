param([string]$pre = 'es', [string]$name = 'cubo')
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$all = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()
$info = $all | Where-Object { $_.Culture.Name -like ($pre + '*') } | Select-Object -First 1
if ($info -eq $null) { $info = $all | Select-Object -First 1 }
if ($info -eq $null) { [Console]::Out.WriteLine('{"err":"norecognizer"}'); [Console]::Out.Flush(); exit }
$eng = New-Object System.Speech.Recognition.SpeechRecognitionEngine($info)
$ch = New-Object System.Speech.Recognition.Choices
foreach ($w in @($name, ('hey ' + $name), ('oye ' + $name), ('hola ' + $name))) { $ch.Add($w) }
$gb = New-Object System.Speech.Recognition.GrammarBuilder
$gb.Culture = $info.Culture
$gb.Append($ch)
$eng.LoadGrammar((New-Object System.Speech.Recognition.Grammar($gb)))
$eng.SetInputToDefaultAudioDevice()
while ($true) {
  try {
    $r = $eng.Recognize([TimeSpan]::FromSeconds(5))
    if ($r -ne $null -and $r.Confidence -gt 0.75) {
      [Console]::Out.WriteLine('{"wake":1}'); [Console]::Out.Flush()
      Start-Sleep -Seconds 9
    }
  } catch { Start-Sleep -Seconds 2 }
}
