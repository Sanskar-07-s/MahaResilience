import React, { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';

interface RecaptchaWidgetProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

export const CLIENT_RECAPTCHA_SITE_KEY = '6LcdL4UtAAAAAJYb2n6Soy9xTG-nyzYxcUPR6lwK';

export const RecaptchaWidget: React.FC<RecaptchaWidgetProps> = ({
  onVerify,
  siteKey = CLIENT_RECAPTCHA_SITE_KEY,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google reCAPTCHA v2 script if not present
    if (!document.getElementById('recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    (window as any).onloadCallback = () => {
      if (containerRef.current && (window as any).grecaptcha) {
        try {
          (window as any).grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onVerify(token),
          });
        } catch (_) {}
      }
    };

    if ((window as any).grecaptcha && containerRef.current) {
      try {
        (window as any).grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerify(token),
        });
      } catch (_) {}
    }
  }, [onVerify, siteKey]);

  return (
    <div className="space-y-1 my-2">
      <div ref={containerRef} className="flex justify-center"></div>
      <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>Protected by Google reCAPTCHA & MahaResilience Anti-Abuse Shield</span>
      </div>
    </div>
  );
};
