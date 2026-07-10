import Script from "next/script";
import React from "react";

const AdSense = () => {
  // Google AdSense - Using Next.js Script component with afterInteractive strategy
  // This ensures script is in <head> while benefiting from Next.js optimizations
  return (
    <Script
      async
      id="adsbygoogle-init"
      strategy="afterInteractive"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4895395148287261"
      crossOrigin="anonymous"
    />
  );
};

export default AdSense;
