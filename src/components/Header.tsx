import { Search, MapPin, RotateCcw, ShoppingBasket, User } from 'lucide-react';
import { Button } from './ui';
import { LogoMark } from './Logo';

export type PageId =
  | 'home'
  | 'catalogue'
  | 'basket'
  | 'groupbuys'
  | 'createcampaign'
  | 'campaigndetail'
  | 'myorders'
  | 'compare'
  | 'bestdeal'
  | 'tinyfish'
  | 'multicompare';

const NAV: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'groupbuys', label: 'Group Orders' },
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'myorders', label: 'My Orders' },
  { id: 'compare', label: 'Compare' },
  { id: 'bestdeal', label: 'Best Deal' },
  { id: 'tinyfish', label: 'TinyFish' },
  { id: 'multicompare', label: 'Multi-Retailer' },
];

export function Header({
  page,
  setPage,
  society,
  setSociety,
  societies,
  residentName,
  setResidentName,
  basketCount,
  search,
  setSearch,
  onReset,
}: {
  page: PageId;
  setPage: (p: PageId) => void;
  society: string;
  setSociety: (s: string) => void;
  societies: readonly string[];
  residentName: string;
  setResidentName: (s: string) => void;
  basketCount: number;
  search: string;
  setSearch: (s: string) => void;
  onReset: () => void;
}) {
  const navActive = (id: PageId) =>
    page === id ||
    (id === 'groupbuys' && (page === 'createcampaign' || page === 'campaigndetail'));

  return (
    <header className="sticky top-0 z-40 bg-neon-cherry/95 backdrop-blur-md border-b border-neon-dark/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* top row */}
        <div className="flex items-center gap-3 h-16">
          <button
            onClick={() => setPage('home')}
            className="flex items-center gap-2.5 shrink-0"
            aria-label="SocietyBasket home"
          >
            <LogoMark size={34} />
            <span className="font-display text-[19px] font-semibold tracking-tight text-neon-ink hidden sm:block">
              Society<span className="text-neon-green">Basket</span>
            </span>
          </button>

          {/* society selector */}
          <div className="relative ml-1 hidden md:flex items-center">
            <MapPin className="absolute left-3 h-4 w-4 text-neon-green" />
            <select
              value={society}
              onChange={(e) => setSociety(e.target.value)}
              className="h-10 pl-9 pr-8 rounded-xl bg-neon-panel ring-1 ring-inset ring-neon-smoke text-sm font-medium text-neon-ink hover:bg-neon-dark/30 transition-colors appearance-none cursor-pointer"
            >
              {societies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* resident name — demo identity */}
          <div className="relative hidden lg:flex items-center">
            <User className="absolute left-3 h-4 w-4 text-neon-green" />
            <input
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              placeholder="Your name"
              className="h-10 w-32 pl-9 pr-3 rounded-xl bg-neon-panel ring-1 ring-inset ring-neon-smoke text-sm text-neon-ink placeholder:text-neon-ash focus:outline-none focus:ring-2 focus:ring-neon-spring/50 transition-all"
            />
          </div>

          {/* search */}
          <div className="relative flex-1 max-w-xl ml-auto md:ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neon-ash" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rice, atta, oil…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-neon-panel ring-1 ring-inset ring-neon-smoke text-sm text-neon-ink placeholder:text-neon-ash focus:outline-none focus:ring-2 focus:ring-neon-spring/50 focus:bg-neon-dark/20 transition-all"
            />
          </div>

          <button
            onClick={() => setPage('basket')}
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-neon-dark/60 text-neon-green hover:bg-neon-dark/80 hover:shadow-glowSoft transition-all"
            aria-label="Open basket"
          >
            <ShoppingBasket className="h-5 w-5" />
            {basketCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-neon-spring text-neon-black text-[10px] font-bold ring-2 ring-neon-cherry shadow-glowSoft">
                {basketCount}
              </span>
            )}
          </button>

          <Button variant="outline" size="md" onClick={onReset} className="hidden xl:inline-flex">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>

        {/* nav row */}
        <nav className="flex gap-1 overflow-x-auto no-scrollbar -mb-px">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all ${
                navActive(n.id)
                  ? 'text-neon-green'
                  : 'text-neon-ash hover:text-neon-ink'
              }`}
            >
              {n.label}
              {navActive(n.id) && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-neon-spring shadow-glowSoft" />
              )}
            </button>
          ))}
          <button
            onClick={onReset}
            className="ml-auto xl:hidden whitespace-nowrap px-4 py-3 text-sm font-semibold text-neon-ash hover:text-neon-ink inline-flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </nav>
      </div>
    </header>
  );
}
