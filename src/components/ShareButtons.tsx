import { useState } from "react";
import { Facebook, Link2, Share2, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  url: string;
  title: string;
  className?: string;
};

function IconBtn({
  onClick,
  href,
  label,
  children,
  colorClass,
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  children: React.ReactNode;
  colorClass: string;
}) {
  const base =
    "inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2";
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        title={label}
        className={`${base} ${colorClass}`}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${base} ${colorClass}`}
    >
      {children}
    </button>
  );
}

// Simple inline X (Twitter) mark — lucide has no X-brand icon.
function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2H21.5l-7.53 8.607L23 22h-6.914l-5.417-6.79L4.4 22H1.14l8.055-9.207L1 2h7.09l4.897 6.243L18.244 2Zm-1.213 18h1.914L7.06 4h-2.05l12.02 16Z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.52 3.48A11.9 11.9 0 0 0 12.06 0C5.5 0 .17 5.33.17 11.89c0 2.1.55 4.14 1.6 5.94L0 24l6.34-1.66a11.86 11.86 0 0 0 5.72 1.46h.01c6.56 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.44-8.43ZM12.06 21.3h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.76.98 1-3.66-.22-.37a9.42 9.42 0 0 1-1.44-5c0-5.2 4.23-9.44 9.44-9.44 2.52 0 4.88.98 6.66 2.77a9.35 9.35 0 0 1 2.76 6.67c0 5.2-4.23 9.44-9.44 9.44Zm5.18-7.06c-.28-.14-1.68-.83-1.94-.93-.26-.09-.45-.14-.64.14-.19.28-.73.93-.9 1.12-.17.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.41-.84-.75-1.41-1.68-1.58-1.96-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.5-.07-.14-.63-1.52-.86-2.09-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.5.07-.76.35s-1 .98-1 2.38 1.02 2.76 1.17 2.95c.14.19 2.02 3.08 4.9 4.32.68.29 1.22.46 1.63.59.69.22 1.31.19 1.81.11.55-.08 1.68-.68 1.92-1.34.24-.66.24-1.22.17-1.34-.07-.12-.26-.19-.54-.33Z" />
    </svg>
  );
}

export function ShareButtons({ url, title, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  const waHref = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const xHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;

  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // user cancelled — fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="mr-1 text-sm text-muted-foreground">Share:</span>
      <IconBtn href={waHref} label="Share on WhatsApp" colorClass="bg-[#25D366] focus:ring-[#25D366]">
        <WhatsAppIcon />
      </IconBtn>
      <IconBtn href={fbHref} label="Share on Facebook" colorClass="bg-[#1877F2] focus:ring-[#1877F2]">
        <Facebook className="h-5 w-5" />
      </IconBtn>
      <IconBtn href={xHref} label="Share on X" colorClass="bg-black focus:ring-black">
        <XIcon />
      </IconBtn>
      <IconBtn onClick={handleShare} label="Copy link or share" colorClass="bg-muted-foreground focus:ring-muted-foreground">
        {copied ? <Check className="h-5 w-5" /> : typeof navigator !== "undefined" && "share" in navigator ? <Share2 className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
      </IconBtn>
    </div>
  );
}
