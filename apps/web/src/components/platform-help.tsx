export function PlatformHelp() {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid) {
    return (
      <ul className="list-disc pl-5 space-y-1">
        <li>Open Settings</li>
        <li>Apps &gt; Your browser (e.g., Chrome)</li>
        <li>Permissions &gt; Location &gt; Allow</li>
        <li>Return here and refresh</li>
      </ul>
    );
  }

  if (isIOS) {
    return (
      <ul className="list-disc pl-5 space-y-1">
        <li>Open Settings</li>
        <li>Privacy &amp; Security &gt; Location Services</li>
        <li>Safari Websites &gt; Allow</li>
        <li>Return here and refresh</li>
      </ul>
    );
  }

  return (
    <ul className="list-disc pl-5 space-y-1">
      <li>Open your browser settings</li>
      <li>Find Site Settings &gt; Location</li>
      <li>Allow location for this site</li>
      <li>Return here and refresh</li>
    </ul>
  );
}

