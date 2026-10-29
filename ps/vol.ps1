[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int f(); int g(); int h(); int i();
  int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
  int j();
  int GetMasterVolumeLevelScalar(out float pfLevel);
  int k(); int l(); int m(); int n();
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, System.Guid pguidEventContext);
  int GetMute(out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref System.Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int f();
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}
[ComImport, Guid("BCDE0395-E52F-46C0-9CCB-36C3F8E83ED8")] class MMDeviceEnumeratorComObject { }
public class Audio {
  static IAudioEndpointVolume Vol() {
    var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
    IMMDevice dev = null;
    Marshal.ThrowExceptionForHR(enumerator.GetDefaultAudioEndpoint(0, 1, out dev));
    IAudioEndpointVolume epv = null;
    var epvid = typeof(IAudioEndpointVolume).GUID;
    Marshal.ThrowExceptionForHR(dev.Activate(ref epvid, 23, 0, out epv));
    return epv;
  }
  public static float Volume {
    get { float v = -1; Marshal.ThrowExceptionForHR(Vol().GetMasterVolumeLevelScalar(out v)); return v; }
    set { Marshal.ThrowExceptionForHR(Vol().SetMasterVolumeLevelScalar(value, System.Guid.Empty)); }
  }
  public static bool Mute {
    get { bool m; Marshal.ThrowExceptionForHR(Vol().GetMute(out m)); return m; }
    set { Marshal.ThrowExceptionForHR(Vol().SetMute(value, System.Guid.Empty)); }
  }
}
'@
$ci = [Globalization.CultureInfo]::InvariantCulture
function State {
  $v = [Math]::Round([Audio]::Volume, 3)
  $m = [Audio]::Mute
  [Console]::Out.WriteLine((@{ vol = $v; mute = $m } | ConvertTo-Json -Compress))
  [Console]::Out.Flush()
}
while (($l = [Console]::In.ReadLine()) -ne $null) {
  try {
    $p = $l.Trim().Split(' ')
    switch ($p[0]) {
      'set' {
        $v = [Math]::Min(1, [Math]::Max(0, [double]::Parse($p[1], $ci)))
        [Audio]::Volume = [float]$v
        if ($v -gt 0 -and [Audio]::Mute) { [Audio]::Mute = $false }
      }
      'step' {
        $d = [double]::Parse($p[1], $ci)
        $v = [Math]::Min(1, [Math]::Max(0, [Audio]::Volume + $d))
        [Audio]::Volume = [float]$v
        if ($d -gt 0 -and [Audio]::Mute) { [Audio]::Mute = $false }
      }
      'toggle' { [Audio]::Mute = -not [Audio]::Mute }
    }
    State
  } catch {
    [Console]::Out.WriteLine('{"err":1}')
    [Console]::Out.Flush()
  }
}
