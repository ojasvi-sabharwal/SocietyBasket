import { Plus, Minus, Check, Tag } from 'lucide-react';
import { Badge, Button, DiscountBadge } from './ui';
import { SmartImage } from './SmartImage';
import {
  type Product,
  type RetailerId,
  effectivePrice,
  RETAILERS,
} from '@/data/catalog';

export function ProductCard({
  product,
  qty,
  onAdd,
  onInc,
  onDec,
  preferredRetailer,
}: {
  product: Product;
  qty: number;
  onAdd: (retailerId: RetailerId) => void;
  onInc: () => void;
  onDec: () => void;
  preferredRetailer: RetailerId;
}) {
  // cheapest in-stock retailer
  const ranked = (Object.keys(product.prices) as RetailerId[])
    .filter((r) => product.prices[r].inStock)
    .sort((a, b) => effectivePrice(product.prices[a]) - effectivePrice(product.prices[b]));
  const cheapestId = ranked[0] ?? preferredRetailer;
  const cheapest = product.prices[cheapestId];
  const effective = effectivePrice(cheapest);
  const isOOS = ranked.length === 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-neon-panel ring-1 ring-neon-dark/60 shadow-card transition-all duration-200 hover:shadow-glowSoft hover:-translate-y-0.5 hover:ring-neon-spring/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-neon-cherry">
        <SmartImage
          src={product.image}
          alt={product.name}
          loading="lazy"
          fallbackLabel={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1">
          {cheapest.discountPct > 0 && (
            <DiscountBadge>
              <Tag className="h-3 w-3" /> {cheapest.discountPct}% OFF
            </DiscountBadge>
          )}
        </div>
        <div className="absolute right-2 top-2">
          <Badge tone="outline">{RETAILERS[cheapestId].name}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="text-sm font-bold text-neon-ink leading-snug line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-neon-ash">{product.packSize}</p>

        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-lg font-extrabold text-neon-green">₹{effective.toFixed(0)}</span>
          {cheapest.discountPct > 0 && (
            <span className="text-xs text-neon-ash line-through">₹{product.basePrice}</span>
          )}
        </div>

        <div className="mt-auto pt-3">
          {isOOS ? (
            <Button variant="outline" size="sm" disabled className="w-full">
              Out of stock
            </Button>
          ) : qty === 0 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAdd(cheapestId)}
              className="w-full"
            >
              <Plus className="h-4 w-4" /> Add to basket
            </Button>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-neon-dark/60 text-neon-green">
              <button
                onClick={onDec}
                className="grid h-9 w-10 place-items-center rounded-l-xl hover:bg-neon-dark/80 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <Check className="h-3.5 w-3.5 text-neon-green" />
                {qty} in basket
              </span>
              <button
                onClick={onInc}
                className="grid h-9 w-10 place-items-center rounded-r-xl hover:bg-neon-dark/80 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
