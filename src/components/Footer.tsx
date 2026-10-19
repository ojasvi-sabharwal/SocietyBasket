import { Heart } from 'lucide-react';
import { LogoMark } from './Logo';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-neon-dark/60 bg-neon-cherry">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-9">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <span className="font-display text-base font-semibold tracking-tight text-neon-ink">
              Society<span className="text-neon-green">Basket</span>
            </span>
          </div>
          <p className="text-xs text-neon-ash">
            Built for a college hackathon · Demo data only · No real checkout or payments
          </p>
          <p className="text-xs text-neon-ash inline-flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-neon-green fill-neon-spring" /> for smarter societies
          </p>
        </div>
      </div>
    </footer>
  );
}
