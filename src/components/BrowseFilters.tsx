import React,{useEffect,useState} from 'react';
import { Filter, X, RotateCcw, Check, Star } from 'lucide-react';

export interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  type: string;
  price: string;
  minRating: number;
  year: string;
  moduleCode: string;
  sortBy: 'newest' | 'downloads' | 'rating' | 'price_asc' | 'price_desc';
}

interface BrowseFiltersProps {
  maximumPrice?: number;
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
  activeCount: number;
  className?: string;
  onCloseMobile?: () => void;
}

const TYPES = ['All', 'PDF', 'Past paper', 'Lecture note', 'Video link', 'Article'];
const PRICES = ['All', 'Free', 'Paid', 'Premium-only'];
const YEARS = ['All', 'Year 1', 'Year 2', 'Year 3', 'Year 4'];


export const BrowseFilters: React.FC<BrowseFiltersProps> = ({
  filters,
  maximumPrice=3000,
  onChange,
  onReset,
  activeCount,
  className = '',
  onCloseMobile,
}) => {
  const [moduleCodes,setModuleCodes]=useState<string[]>([]);
  useEffect(()=>{let active=true;void fetch('/api/modules',{credentials:'include',cache:'no-store'}).then(r=>r.ok?r.json():[]).then(rows=>{if(active && Array.isArray(rows))setModuleCodes(rows.filter((m:any)=>m.active!==false).map((m:any)=>m.code));}).catch(()=>{});return()=>{active=false;};},[]);
  return (
    <aside className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D6] dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#FF4A00]" />
          <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
            Filter Resources
          </h3>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#FF4A00] text-white text-[11px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-neutral-500 hover:text-[#FF4A00] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Resource Type */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          Resource Type
        </label>
        <div className="space-y-1.5">
          {TYPES.map((t) => {
            const isSelected = filters.type === t;
            return (
              <label
                key={t}
                onClick={() => onChange({ type: t })}
                className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#FF4A00]/10 text-[#FF4A00] font-bold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{t}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#FF4A00] stroke-[2.8]" />}
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Pricing Tier */}
      <div className="space-y-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          Price Model
        </label>
        <div className="space-y-1.5">
          {PRICES.map((p) => {
            const isSelected = filters.price === p;
            return (
              <label
                key={p}
                onClick={() => onChange({ price: p })}
                className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#FF4A00]/10 text-[#FF4A00] font-bold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{p}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#FF4A00] stroke-[2.8]" />}
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Minimum Student Rating */}
      <div className="space-y-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          Minimum Rating
        </label>
        <div className="space-y-1.5">
          {[
            { label: 'Any Rating', val: 0 },
            { label: '4.5+ Stars (Top Rated)', val: 4.5 },
            { label: '4.0+ Stars', val: 4.0 },
          ].map((r) => {
            const isSelected = filters.minRating === r.val;
            return (
              <label
                key={r.val}
                onClick={() => onChange({ minRating: r.val })}
                className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#FF4A00]/10 text-[#FF4A00] font-bold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {r.val > 0 && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  <span>{r.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#FF4A00] stroke-[2.8]" />}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800"><h4 className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-300">Price range (Rs.)</h4><div className="grid grid-cols-2 gap-2"><label className="text-xs text-neutral-600 dark:text-neutral-300">Minimum<input aria-label="Minimum resource price" type="number" min={0} max={maximumPrice} value={filters.minPrice??0} onChange={e=>{const n=Math.max(0,Math.min(maximumPrice,e.target.valueAsNumber||0));onChange({minPrice:n,maxPrice:Math.max(n,filters.maxPrice??maximumPrice)});}} className="w-full border rounded-lg p-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"/></label><label className="text-xs text-neutral-600 dark:text-neutral-300">Maximum<input aria-label="Maximum resource price" type="number" min={0} max={maximumPrice} value={filters.maxPrice??maximumPrice} onChange={e=>{const n=Math.max(0,Math.min(maximumPrice,e.target.valueAsNumber||0));onChange({maxPrice:n,minPrice:Math.min(n,filters.minPrice??0)});}} className="w-full border rounded-lg p-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"/></label></div><p className="text-xs text-neutral-500 dark:text-neutral-300">Free and Premium-only items have a purchase price of Rs. 0. Membership is separate.</p></div>
      {/* 4. Academic Year */}
      <div className="space-y-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          Academic Year
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {YEARS.map((y) => {
            const isSelected = filters.year === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => onChange({ year: y })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF4A00] text-white border-[#FF4A00] shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Module Code Shortcut */}
      <div className="space-y-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          Popular Modules
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['All',...moduleCodes].map((mod) => {
            const isSelected = filters.moduleCode === mod;
            return (
              <button
                key={mod}
                type="button"
                onClick={() => onChange({ moduleCode: mod })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E6FEB] text-white border-[#1E6FEB] shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                }`}
              >
                {mod}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
