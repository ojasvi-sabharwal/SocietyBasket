import { useState, type ImgHTMLAttributes } from 'react';
import { ShoppingBasket } from 'lucide-react';

type SmartImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  alt: string;
  fallbackLabel?: string;
};

// Image with graceful fallback: if the source fails to load, show a
// branded placeholder tile instead of a broken-image icon.
export function SmartImage({ alt, fallbackLabel, className, ...imgProps }: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-neon-soft text-neon-green ${className ?? ''}`}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-neon-green shadow-soft">
          <ShoppingBasket className="h-5 w-5" />
        </span>
        {fallbackLabel && (
          <span className="px-2 text-center text-[11px] font-semibold text-neon-ash leading-tight">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      {...imgProps}
    />
  );
}
