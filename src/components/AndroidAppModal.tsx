import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Package,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { downloadDreamlineAndroidApkProject, sanitizeAppUrl } from '../game/androidApkPackage';

interface AndroidAppModalProps {
  onClose: () => void;
  onDownloaded?: (message: string) => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({
  onClose,
  onDownloaded,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadedZip, setDownloadedZip] = useState(false);
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);

  const liveUrl =
    typeof window !== 'undefined'
      ? sanitizeAppUrl(`${window.location.origin}${window.location.pathname}`)
      : 'https://dreamline.app/';

  const handleInstallNow = async () => {
    const accepted = await install();
    if (accepted) {
      setInstallFeedback('DREAMLINE is installing as a full-screen Android app!');
      onDownloaded?.('Installing DREAMLINE Android App…');
    } else {
      setInstallFeedback('Installation dismissed — you can install anytime from this menu.');
    }
  };

  const handleDownloadApkProject = () => {
    const filename = downloadDreamlineAndroidApkProject(liveUrl);
    setDownloadedZip(true);
    onDownloaded?.(`Downloaded ${filename} (Android Studio APK Project)`);
    window.setTimeout(() => setDownloadedZip(false), 3500);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Download DREAMLINE Android App & APK"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#120E20]/86 p-3 sm:p-5"
    >
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-xl bg-[#1A152C] border border-[#F5D6C0]/28 text-[#FAF5EF] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 bg-[#221B3A] border-b border-[#F5D6C0]/16">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono-tabular uppercase tracking-widest text-[#8DE4FF]">
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Android App · APK &amp; Offline Install</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-semibold tracking-wide mt-0.5 text-[#FAF5EF]">
              Get DREAMLINE on Android
            </h2>
            <p className="text-xs text-[#DFC8BC] mt-0.5">
              Install directly onto your Android phone as a full-screen app, or download the ready-to-build APK project.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Android App Menu"
            onClick={onClose}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-md hover:bg-[#2E264A] text-[#F2E5DC] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-sm">
          {/* Option 1: Direct Android App Install (WebAPK / PWA) */}
          <section className="rounded-lg bg-[#231C3A] border border-[#8DE4FF]/35 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="font-display text-sm sm:text-base font-semibold text-[#FAF5EF]">
                1. Instant Android App Install (No PC Needed)
              </div>
              <span className="text-[10px] font-mono-tabular uppercase tracking-wider px-2 py-0.5 rounded bg-[#182E42] text-[#AEEBFF] border border-[#8DE4FF]/35 shrink-0">
                WebAPK
              </span>
            </div>
            <p className="text-xs text-[#DDD0DF] leading-relaxed">
              Chrome on Android automatically packages DREAMLINE into a full-screen app on your home screen &amp; app drawer with offline caching and mobile joystick controls.
            </p>

            {isInstalled ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#1D3B32] border border-[#8CD9B2]/45 text-xs font-medium text-[#B9F3D5]">
                <Check className="w-4 h-4" />
                <span>DREAMLINE is already installed as an App on this device</span>
              </div>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={handleInstallNow}
                className="w-full py-2.5 px-4 rounded-md bg-[#8DE4FF] hover:bg-[#B2EEFF] text-[#112233] text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install DREAMLINE Android App Now</span>
              </button>
            ) : isIOS ? (
              <div className="rounded-md bg-[#171226] border border-[#F5D6C0]/16 px-3.5 py-2.5 text-xs text-[#E8DACF] space-y-1">
                <div className="font-medium text-[#FCE2C8]">Install on iPhone / iPad (Safari):</div>
                <p>1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.</p>
                <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
              </div>
            ) : (
              <div className="rounded-md bg-[#171226] border border-[#F5D6C0]/16 px-3.5 py-2.5 text-xs text-[#E8DACF] space-y-1">
                <div className="font-medium text-[#FCE2C8]">Install on Android Chrome (2 taps):</div>
                <p>1. Open the shared DREAMLINE URL in <strong>Chrome on Android</strong>.</p>
                <p>2. Tap the <strong>⋮ Menu</strong> (top-right) → <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</p>
              </div>
            )}

            {installFeedback && (
              <p className="text-xs text-[#9EE4C0] font-medium">{installFeedback}</p>
            )}
          </section>

          {/* Option 2: Download Ready-to-Build Android APK Project (.zip) */}
          <section className="rounded-lg bg-[#231C3A] border border-[#F4BE98]/38 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="font-display text-sm sm:text-base font-semibold text-[#FAF5EF]">
                2. Download Android APK Project (.zip)
              </div>
              <span className="text-[10px] font-mono-tabular uppercase tracking-wider px-2 py-0.5 rounded bg-[#36263F] text-[#FCE2C8] border border-[#F4BE98]/35 shrink-0">
                Kotlin + Gradle
              </span>
            </div>
            <p className="text-xs text-[#DDD0DF] leading-relaxed">
              Downloads a complete, ready-to-compile Android Studio / Gradle APK project (<code>com.dreamline.railway</code>) pre-configured with hardware-accelerated WebGL, fullscreen landscape mode, and TWA manifest.
            </p>
            <button
              type="button"
              onClick={handleDownloadApkProject}
              className="w-full py-2.5 px-4 rounded-md bg-[#F4BE98] hover:bg-[#FAD2B4] text-[#1D162E] text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {downloadedZip ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded dreamline-android-apk-project.zip</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Android APK Project (.zip)</span>
                </>
              )}
            </button>
          </section>

          {/* Option 3: Online 1-Minute .apk Generator via PWABuilder */}
          <section className="rounded-lg bg-[#1F1934] border border-[#F5D6C0]/18 p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-display text-sm font-semibold text-[#FAF5EF]">
              <Package className="w-4 h-4 text-[#F4BE98]" />
              <span>3. Generate Signed .apk File Online (No Android Studio)</span>
            </div>
            <p className="text-xs text-[#D5C6D8] leading-relaxed">
              Because DREAMLINE includes a full Android Web App Manifest, Service Worker, and maskable PNG icons, you can copy the app URL below and paste it into <strong>pwabuilder.com</strong> → <strong>Package for Android</strong> to download a signed <code>.apk</code> file directly in your browser.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-md bg-[#130F22] border border-[#F5D6C0]/16 font-mono-tabular text-[11px] text-[#E6D7CC] truncate">
                {liveUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 rounded-md bg-[#2B2346] hover:bg-[#3A2F5E] border border-[#F5D6C0]/22 text-xs font-medium text-[#FAF5EF] inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#9EE4C0]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#161226] border-t border-[#F5D6C0]/16 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-[#27203F] hover:bg-[#342B52] border border-[#F5D6C0]/20 text-[#F2E5DC] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-[#2A203E]/95 border border-[#F4BE98]/45 px-3 py-1.5 text-xs font-medium text-[#FCE2C8] shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#F4BE98]" />
      <span>Offline Mode — Playing from cached app files</span>
    </div>
  );
};
