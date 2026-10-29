Add-Type -Namespace S -Name N -MemberDefinition '[DllImport("shell32.dll")] public static extern int SHQueryUserNotificationState(out int s);'
while ($true) {
  $s = 0
  try { [void][S.N]::SHQueryUserNotificationState([ref]$s) } catch { }
  $fs = ($s -eq 2 -or $s -eq 3 -or $s -eq 4)
  [Console]::Out.WriteLine((@{ fs = $fs } | ConvertTo-Json -Compress))
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 2000
}
