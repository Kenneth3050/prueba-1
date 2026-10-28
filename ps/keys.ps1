Add-Type -Namespace W -Name K -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte b, byte s, uint f, UIntPtr e);'
function Press($vk) {
  [W.K]::keybd_event($vk, 0, 0, [UIntPtr]::Zero)
  [W.K]::keybd_event($vk, 0, 2, [UIntPtr]::Zero)
}
while (($l = [Console]::In.ReadLine()) -ne $null) {
  switch ($l.Trim()) {
    'pp'   { Press 0xB3 }
    'next' { Press 0xB0 }
    'prev' { Press 0xB1 }
  }
}
