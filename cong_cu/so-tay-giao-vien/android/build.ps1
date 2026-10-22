param(
  [string]$SdkRoot = $env:ANDROID_HOME,
  [string]$JdkRoot = $env:JAVA_HOME,
  [string]$BuildToolsVersion = '34.0.0',
  [string]$SigningStore = '',
  [string]$OutputApk = ''
)
$ErrorActionPreference = 'Stop'
if (!$SdkRoot -or !$JdkRoot) { throw 'Provide -SdkRoot (Android SDK) and -JdkRoot (JDK 17 or newer).' }
$androidRoot = $PSScriptRoot
$buildRoot = Join-Path $androidRoot 'build'
$toolsRoot = Join-Path $SdkRoot "build-tools/$BuildToolsVersion"
$platformJar = Join-Path $SdkRoot 'platforms/android-35/android.jar'
$javaBin = Join-Path $JdkRoot 'bin'
if (!$OutputApk) { $OutputApk = Join-Path $androidRoot '../So-tay-Giao-vien-2.0.apk' }
if (!$SigningStore) { $SigningStore = Join-Path $buildRoot 'debug.keystore' }
function CheckExit { if ($LASTEXITCODE -ne 0) { throw "Build command failed: $LASTEXITCODE" } }
New-Item -ItemType Directory -Force "$buildRoot/classes","$buildRoot/dex","$buildRoot/assets" | Out-Null
Copy-Item $platformJar "$buildRoot/android.jar" -Force
$platformJar = "$buildRoot/android.jar"
Copy-Item "$toolsRoot/core-lambda-stubs.jar" "$buildRoot/core-lambda-stubs.jar" -Force
Copy-Item -Path "$androidRoot/../web/*" -Destination "$buildRoot/assets" -Force
& "$toolsRoot/aapt2.exe" compile --dir "$androidRoot/app/src/main/res" -o "$buildRoot/resources.zip"
CheckExit
& "$toolsRoot/aapt2.exe" link -o "$buildRoot/base.apk" -I $platformJar --manifest "$androidRoot/app/src/main/AndroidManifest.xml" -A "$buildRoot/assets" "$buildRoot/resources.zip"
CheckExit
$sources = @(Get-ChildItem "$androidRoot/app/src/main/java" -Recurse -Filter '*.java' | Select-Object -ExpandProperty FullName)
& "$javaBin/javac.exe" -g -encoding UTF-8 -source 8 -target 8 -bootclasspath "$platformJar;$buildRoot/core-lambda-stubs.jar" -d "$buildRoot/classes" @sources
CheckExit
& "$javaBin/jar.exe" cf "$buildRoot/classes.jar" -C "$buildRoot/classes" .
CheckExit
& "$javaBin/java.exe" -cp "$toolsRoot/lib/d8.jar" com.android.tools.r8.D8 --lib $platformJar --min-api 26 --output "$buildRoot/dex" "$buildRoot/classes.jar"
CheckExit
Copy-Item "$buildRoot/base.apk" "$buildRoot/unaligned.apk" -Force
& "$javaBin/jar.exe" uf "$buildRoot/unaligned.apk" -C "$buildRoot/dex" classes.dex
CheckExit
& "$toolsRoot/zipalign.exe" -f -p 4 "$buildRoot/unaligned.apk" "$buildRoot/aligned.apk"
CheckExit
if (!(Test-Path -LiteralPath $SigningStore)) {
  & "$javaBin/keytool.exe" -genkeypair -keystore $SigningStore -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Huycomf Development,O=Huycomf,C=VN' -noprompt
  CheckExit
}
& "$javaBin/java.exe" -jar "$toolsRoot/lib/apksigner.jar" sign --ks $SigningStore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out $OutputApk "$buildRoot/aligned.apk"
CheckExit
& "$javaBin/java.exe" -jar "$toolsRoot/lib/apksigner.jar" verify --verbose $OutputApk
CheckExit
& "$toolsRoot/zipalign.exe" -c -v 4 $OutputApk | Select-Object -Last 1
CheckExit
Get-FileHash $OutputApk -Algorithm SHA256




