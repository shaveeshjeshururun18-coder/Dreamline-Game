/**
 * Pure TypeScript Android APK Project Packager + Standard ZIP Builder.
 * Generates a real, ready-to-build Android Kotlin WebView + Trusted Web Activity
 * Gradle project (.zip) configured for DREAMLINE with hardware-accelerated WebGL.
 */

export interface ZipEntryInput {
  path: string;
  content: string | Uint8Array;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Encodes files into a spec-compliant Store (method 0) ZIP archive with valid
 * local file headers, CRC-32 checksums, central directory, and EOCD record.
 */
export function buildZipBytes(entries: ZipEntryInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path.replace(/^\/+/, ''));
    const dataBytes =
      typeof entry.content === 'string' ? encoder.encode(entry.content) : entry.content;
    const crc = computeCrc32(dataBytes);

    // Local File Header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lView = new DataView(localHeader.buffer);
    lView.setUint32(0, 0x04034b50, true); // PK\x03\x04
    lView.setUint16(4, 20, true); // version needed: 2.0
    lView.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lView.setUint16(8, 0, true); // compression: 0 (store)
    lView.setUint16(10, 0, true); // mod time
    lView.setUint16(12, 0x5821, true); // mod date
    lView.setUint32(14, crc, true);
    lView.setUint32(18, dataBytes.length, true);
    lView.setUint32(22, dataBytes.length, true);
    lView.setUint16(26, nameBytes.length, true);
    lView.setUint16(28, 0, true); // extra length
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central Directory Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cView = new DataView(centralHeader.buffer);
    cView.setUint32(0, 0x02014b50, true); // PK\x01\x02
    cView.setUint16(4, 20, true); // version made by
    cView.setUint16(6, 20, true); // version needed
    cView.setUint16(8, 0x0800, true); // UTF-8 flag
    cView.setUint16(10, 0, true); // compression: store
    cView.setUint16(12, 0, true);
    cView.setUint16(14, 0x5821, true);
    cView.setUint32(16, crc, true);
    cView.setUint32(20, dataBytes.length, true);
    cView.setUint32(24, dataBytes.length, true);
    cView.setUint16(28, nameBytes.length, true);
    cView.setUint16(30, 0, true); // extra length
    cView.setUint16(32, 0, true); // comment length
    cView.setUint16(34, 0, true); // disk number start
    cView.setUint16(36, 0, true); // internal attrs
    cView.setUint32(38, 0, true); // external attrs
    cView.setUint32(42, offset, true); // relative offset of local header
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true); // PK\x05\x06
  eView.setUint16(4, 0, true);
  eView.setUint16(6, 0, true);
  eView.setUint16(8, entries.length, true);
  eView.setUint16(10, entries.length, true);
  eView.setUint32(12, centralSize, true);
  eView.setUint32(16, centralStart, true);
  eView.setUint16(20, 0, true);

  const totalSize = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalSize);
  let cursor = 0;
  for (const part of localParts) {
    output.set(part, cursor);
    cursor += part.length;
  }
  for (const part of centralParts) {
    output.set(part, cursor);
    cursor += part.length;
  }
  output.set(eocd, cursor);
  return output;
}

export function sanitizeAppUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return 'https://example.com/';
  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/?$/, '/');
  } catch {
    return trimmed;
  }
}

export function buildDreamlineAndroidProjectFiles(rawAppUrl: string): ZipEntryInput[] {
  const appUrl = sanitizeAppUrl(rawAppUrl);
  let host = 'example.com';
  try {
    host = new URL(appUrl).host;
  } catch {
    host = 'example.com';
  }

  const packageId = 'com.dreamline.railway';

  const settingsGradle = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "DREAMLINE"
include(":app")
`;

  const rootBuildGradle = `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`;

  const gradleProperties = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;

  const appBuildGradle = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${packageId}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${packageId}"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.11.0")
}
`;

  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.Dreamline"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout|smallestScreenSize"
            android:exported="true"
            android:hardwareAccelerated="true"
            android:launchMode="singleTask"
            android:screenOrientation="sensorLandscape">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

  const mainActivityKt = `package ${packageId}

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val dreamlineUrl = "${appUrl}"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemBars()

        webView = WebView(this).apply {
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            setBackgroundColor(0xFF171324.toInt())
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                allowContentAccess = true
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            }
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
        }

        setContentView(webView)
        webView.loadUrl(dreamlineUrl)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    private fun hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowCompat.getInsetsController(window, window.decorView)
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsetsCompat.Type.systemBars())
    }
}
`;

  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">DREAMLINE</string>
</resources>
`;

  const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.Dreamline" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowBackground">#171324</item>
        <item name="android:statusBarColor">#171324</item>
        <item name="android:navigationBarColor">#171324</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>
`;

  const twaManifest = JSON.stringify(
    {
      packageId,
      host,
      name: 'DREAMLINE — A Peaceful Railway Journey',
      launcherName: 'DREAMLINE',
      display: 'standalone',
      themeColor: '#171324',
      themeColorDark: '#171324',
      navigationColor: '#171324',
      navigationColorDark: '#171324',
      backgroundColor: '#171324',
      enableNotifications: false,
      startUrl: '/',
      iconUrl: `${appUrl}pwa-512x512.png`,
      maskableIconUrl: `${appUrl}pwa-maskable-512x512.png`,
      splashScreenFadeOutDuration: 300,
      orientation: 'landscape',
      fallbackType: 'webview',
      appVersionName: '1.0.0',
      appVersionCode: 1,
    },
    null,
    2
  );

  const buildScript = `#!/usr/bin/env bash
set -euo pipefail

echo "Building DREAMLINE Android APK..."
if command -v gradle >/dev/null 2>&1; then
  gradle assembleRelease
  echo "APK ready at: app/build/outputs/apk/release/app-release.apk"
else
  echo "Open this folder in Android Studio -> Build -> Build Bundle(s) / APK(s) -> Build APK(s)"
fi
`;

  const readme = `# DREAMLINE — Android APK Project

This package builds a native, hardware-accelerated Android APK wrapper for **DREAMLINE** pointing to:
${appUrl}

## Option 1 — Build APK in Android Studio (Easiest Local Build)
1. Unzip this folder.
2. Open **Android Studio** -> **Open** -> select this \`dreamline-android-apk\` folder.
3. Wait for Gradle Sync to finish.
4. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
5. Copy \`app/build/outputs/apk/debug/app-debug.apk\` (or \`release/app-release.apk\`) to your Android phone and tap to install!

## Option 2 — Build Signed APK Online in 1 Minute (No Android Studio Needed)
1. Go to https://www.pwabuilder.com
2. Paste your live DREAMLINE URL: ${appUrl}
3. Click **Package For Stores -> Android -> Generate Package** to download a ready-to-install \`.apk\`.

## Option 3 — Bubblewrap CLI (Trusted Web Activity APK)
\`\`\`bash
npm install -g @bubblewrap/cli
bubblewrap build
\`\`\`
`;

  return [
    { path: 'dreamline-android-apk/settings.gradle', content: settingsGradle },
    { path: 'dreamline-android-apk/build.gradle', content: rootBuildGradle },
    { path: 'dreamline-android-apk/gradle.properties', content: gradleProperties },
    { path: 'dreamline-android-apk/app/build.gradle', content: appBuildGradle },
    { path: 'dreamline-android-apk/app/src/main/AndroidManifest.xml', content: androidManifest },
    {
      path: 'dreamline-android-apk/app/src/main/java/com/dreamline/railway/MainActivity.kt',
      content: mainActivityKt,
    },
    { path: 'dreamline-android-apk/app/src/main/res/values/strings.xml', content: stringsXml },
    { path: 'dreamline-android-apk/app/src/main/res/values/styles.xml', content: stylesXml },
    { path: 'dreamline-android-apk/twa-manifest.json', content: twaManifest },
    { path: 'dreamline-android-apk/build-apk.sh', content: buildScript },
    { path: 'dreamline-android-apk/README-BUILD-APK.md', content: readme },
  ];
}

export function createDreamlineAndroidProjectZip(rawAppUrl: string): Uint8Array {
  return buildZipBytes(buildDreamlineAndroidProjectFiles(rawAppUrl));
}

export function downloadDreamlineAndroidApkProject(rawAppUrl: string): string {
  const filename = 'dreamline-android-apk-project.zip';
  const bytes = createDreamlineAndroidProjectZip(rawAppUrl);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}
