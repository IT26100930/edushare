import {matchesResourceQuery,resourceSearchKind} from '../utils/resourceSearch';
import {resolveBrowseCategory,resolveBrowseType} from '../utils/browseNavigation';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams,useLocation,useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  SlidersHorizontal,
  X,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  BookOpen,
} from 'lucide-react';

import { useApp } from '../context/AppContext.tsx';
import { Resource } from '../data/models.ts';
import { matchesBrowseCategory } from '../utils/resourceCategories.ts';
import { Tag } from '../components/Tag.tsx';
import { Button } from '../components/Button.tsx';
import { ResourceCard } from '../components/ResourceCard.tsx';
import { BrowseSearch } from '../components/BrowseSearch.tsx';
import { BrowseFilters, FilterState } from '../components/BrowseFilters.tsx';
import { BrowseEmptyState } from '../components/BrowseEmptyState.tsx';
import { ResourceCardSkeleton } from '../components/shared/Skeleton.tsx';


export const BrowsePage: React.FC = () => {
  const { resources: catalogResources, isBookmarked, toggleBookmark,catalogReady } = useApp();
  const resources=useMemo(()=>catalogResources.filter(r=>!r.status||r.status==='approved'),[catalogResources]);
  const [searchParams, setSearchParams] = useSearchParams();
  const location=useLocation();
  const navigate=useNavigate();
  const shouldReduceMotion = useReducedMotion();
  type BrowseCategory = { id: number; name: string; image: string };
  const [categories, setCategories] = useState<BrowseCategory[]>([]);
  const [categoriesLoaded,setCategoriesLoaded]=useState(false);
  const [categoryError, setCategoryError] = useState(false);
  useEffect(() => {
    let active = true;
    const refreshCategories = async () => {
      try {
        const response = await fetch('/api/categories', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) throw new Error(`Category API returned ${response.status}`);
        const rows: Array<{id: number; name: string; image?: string}> = await response.json();
        if (!active) return;
        setCategories(rows.filter(row => !!row.name?.trim()).map(row => ({
          id: row.id, name: row.name.trim(), image: row.image || ''
        })));
        setCategoryError(false);setCategoriesLoaded(true);
      } catch {
        if (active) setCategoryError(true);
      }
    };
    // Server-side category updates must appear when a student returns to Browse.
    void refreshCategories();
    const onFocus = () => { if (!document.hidden) void refreshCategories(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);


  // Search & Category
  const [searchQuery, setSearchQuery] = useState('');
  const activeCategory=resolveBrowseCategory(searchParams.get('category'),categories.map(c=>c.name));
  const setActiveCategory=(category:string)=>{const next=new URLSearchParams(searchParams);if(category==='All')next.delete('category');else next.set('category',category);setSearchParams(next);};
  // Wait for the saved categories before deciding whether a shortcut is stale.
  useEffect(()=>{if(categoriesLoaded&&!categoryError&&activeCategory!=='All'&&!categories.some(c=>c.name===activeCategory)){
    const next=new URLSearchParams(searchParams);next.delete('category');setSearchParams(next,{replace:true});
  }},[categoriesLoaded,categoryError,activeCategory,categories]);

  // Left Filters
  const [filters, setFilters] = useState<FilterState>({
    type: resolveBrowseType(searchParams.get('type')),
    price: 'All',
    minPrice: 0,
    minRating: 0,
    year: 'All',
    moduleCode: 'All',
    sortBy: 'downloads',
  });

  useEffect(()=>{setFilters(old=>({...old,type:resolveBrowseType(searchParams.get('type'))}));},[location.search]);
  // Both direct links and navigation within Browse arrive at the filtered result list.
  useEffect(()=>{
    if(!categoriesLoaded||catalogReady===false||!(location.hash==='#resources'||searchParams.has('category')||searchParams.has('type')))return;
    const timer=window.setTimeout(()=>{const results=document.getElementById('resources');results?.scrollIntoView({behavior:shouldReduceMotion?'auto':'smooth',block:'start'});results?.focus({preventScroll:true});},320);
    return()=>window.clearTimeout(timer);
  },[location.key,categoriesLoaded,catalogReady,shouldReduceMotion]);

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Pagination "Load more"
  const [visibleCount, setVisibleCount] = useState(9);

  const isFiltering=catalogReady===false;

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(9);
  }, [activeCategory, filters, searchQuery]);

  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    if(updated.type!==undefined){const next=new URLSearchParams(searchParams);if(updated.type==='All')next.delete('type');else next.set('type',updated.type);setSearchParams(next);}
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      type: 'All',
      price: 'All',
      minPrice: 0,
      minRating: 0,
      year: 'All',
      moduleCode: 'All',
      sortBy: 'downloads',
    });
    setSearchParams({});
  };

  // Filter matching logic
  const filteredResources = useMemo(() => {
    return resources
      .filter((res) => {
        if(!matchesResourceQuery(res,searchQuery))return false;

        // Category chips use the categories saved by the admin, not a fixed demo list.
        if (!matchesBrowseCategory(res, activeCategory)) return false;

        // 3. Type
        if (filters.type !== 'All') {
          if (filters.type === 'Past paper') {
            if (res.type !== 'Past Paper') return false;
          } else if (filters.type === 'Lecture note') {
            if (res.type !== 'Notes' && res.type !== 'Lab Guide') return false;
          } else if (filters.type === 'PDF') {
            if (res.fileFormat !== 'PDF') return false;
          } else if (filters.type === 'Article') {
            if (res.type !== 'Article' && res.type !== 'Article link') return false;
          } else if (filters.type === 'Video link') {
            if (res.type !== 'Video link' && res.fileFormat !== 'VIDEO') return false;
          }
        }

        // 4. Price
        if (filters.price !== 'All') {
          if (filters.price === 'Free' && res.priceType !== 'Free') return false;
          if (filters.price === 'Paid' && res.priceType !== 'Paid') return false;
          if (filters.price === 'Premium-only' && res.priceType !== 'Premium') return false;
        }

        const listedPrice=res.priceType==='Paid'?res.price:0;
        if(listedPrice<(filters.minPrice??0)||listedPrice>(filters.maxPrice??Number.POSITIVE_INFINITY))return false;

        // 5. Min Rating
        if (filters.minRating > 0 && res.rating < filters.minRating) {
          return false;
        }

        // 6. Academic Year
        if (filters.year !== 'All' && res.academicYear !== filters.year) {
          return false;
        }

        // 7. Module Code
        if (filters.moduleCode !== 'All' && res.moduleCode !== filters.moduleCode) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'downloads') return b.downloads - a.downloads;
        if (filters.sortBy === 'rating') return b.rating - a.rating;
        if (filters.sortBy === 'price_asc') return a.price - b.price;
        if (filters.sortBy === 'price_desc') return b.price - a.price;
        return 0; // 'newest' uses default mock sort
      });
  }, [resources, searchQuery, activeCategory, filters]);

  const hasSearch=Boolean(searchQuery.trim());
  const resultKinds=useMemo(()=>filteredResources.reduce((counts,r)=>{counts[resourceSearchKind(r)]++;return counts;},{PDF:0,Video:0,Article:0}),[filteredResources]);
  const liveSuggestions=useMemo(()=>filteredResources.map(r=>({id:r.id,title:r.title,moduleCode:r.moduleCode,category:r.category,kind:resourceSearchKind(r),author:r.author.username})),[filteredResources]);
  const allQueryMatches=useMemo(()=>resources.filter(r=>matchesResourceQuery(r,searchQuery)).length,[resources,searchQuery]);
  const viewResults=()=>{const target=document.getElementById('resources');target?.scrollIntoView({behavior:shouldReduceMotion?'auto':'smooth',block:'start'});target?.focus({preventScroll:true});};
  const searchAllFilters=()=>{setFilters({type:'All',price:'All',minPrice:0,minRating:0,year:'All',moduleCode:'All',sortBy:'downloads'});setSearchParams({});};

  // Active filter count for badge
  const activeFilterCount =
    (filters.type !== 'All' ? 1 : 0) +
    (filters.price !== 'All' ? 1 : 0) +
    ((filters.minPrice??0)>0 || filters.maxPrice!==undefined ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.year !== 'All' ? 1 : 0) +
    (filters.moduleCode !== 'All' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  // Paginated slice
  const displayedItems = filteredResources.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResources.length;

  return (
    <div className="portal-page w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-10 space-y-8">
      {/* 1. Header Section */}
      <div className="portal-hero catalog-intro portal-hero-copy text-center mx-auto space-y-4 p-6 sm:p-8">
        <Tag variant="peach">Browse</Tag>

        <h1
          className="font-extrabold font-display text-neutral-900 dark:text-neutral-100 tracking-tight leading-[0.98]"
          style={{ fontSize: 'clamp(32px, 4.2vw, 54px)' }}
        >
          Find your next study resource
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Search a title, topic or module. Open a file below, or view all matching resources.
        </p>

        {/* One matching set powers the search dropdown and result cards. */}
        <div className="pt-2 max-w-3xl mx-auto">
          <BrowseSearch
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={liveSuggestions}
            onSelectSuggestion={setSearchQuery}
            onOpenResource={id=>navigate('/resource/'+encodeURIComponent(id))}
            onSubmit={viewResults}
            resultCount={filteredResources.length}
            loading={catalogReady===false}
            otherMatches={allQueryMatches}
            onClearFilters={searchAllFilters}
          />
          <div className="catalog-feedback mt-3 rounded-xl px-4 py-3 text-left text-sm flex flex-wrap items-center justify-between gap-3">
            <div role="status" aria-live="polite" aria-atomic="true">{catalogReady===false?'Loading your study catalog…':hasSearch?<><strong>{filteredResources.length} {filteredResources.length===1?'resource':'resources'} for “{searchQuery.trim()}”</strong><span className="block mt-1">{resultKinds.PDF} PDF{resultKinds.PDF===1?'':'s'} · {resultKinds.Video} video{resultKinds.Video===1?'':'s'} · {resultKinds.Article} article{resultKinds.Article===1?'':'s'}{activeCategory!=='All'?` · ${activeCategory}`:''}</span></>:<span>{resources.length} resources to explore · PDF notes, videos and articles</span>}</div>
            {hasSearch&&<div className="flex flex-wrap gap-3"><button type="button" onClick={viewResults} className="rounded-full bg-white text-[#263577] px-4 py-2 font-bold">View results</button><button type="button" onClick={()=>setSearchQuery('')} className="text-sm underline">Browse subjects</button></div>}
          </div>
        </div>
      </div>

      {categoryError && <p role="status" className="text-sm text-amber-600">Categories could not be loaded. Please refresh the page.</p>}
      {/* 2. Category Chips Row with Sliding Active-Pill Animation */}
      {!hasSearch&&<div className="relative border-y border-[#E8E2D6] dark:border-neutral-800 py-4">
        <div role="group" aria-label="Resource categories" className="flex flex-wrap items-center justify-start gap-2 p-1">
          {['All', ...categories.map(item => item.name)].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);

                }}
                className={`relative isolate px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-tight transition-colors duration-200 select-none whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#FF4A00] text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>}

      {/* Category photos are managed by admins and saved in categories.txt.
          Video Lessons, PDF Notes, and Past Papers cards filter by real resource type. */}
      {!hasSearch && categories.length > 0 && (
        <section aria-label="Browse by subject" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold font-display text-neutral-900 dark:text-neutral-100">Explore Subjects</h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Choose a subject to view its resources</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((cat) => {
              const count = resources.filter(res => matchesBrowseCategory(res, cat.name)).length;
              const selected = activeCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setActiveCategory(cat.name);

                  }}
                  className={`group overflow-hidden rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF4A00] ${selected ? 'border-[#FF4A00] ring-2 ring-[#FF4A00]/20 bg-orange-50 dark:bg-orange-950/30' : 'border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900'}`}
                >
                  <div className="h-24 sm:h-28 bg-orange-50 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={`${cat.name} subject cover`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={event => { event.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <BookOpen className="h-9 w-9 text-[#FF4A00]" aria-hidden="true" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">{cat.name}</p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{count} {count === 1 ? 'resource' : 'resources'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Mobile Filters Toggle & Sort Bar */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 border border-[#E8E2D6] dark:border-neutral-700 shadow-2xs"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF4A00]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#FF4A00] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Mobile Sort */}
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-300" />
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
            className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF4A00]"
          >
            <option value="downloads">Most Downloaded</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* 3. Main Workspace: Left Sidebar + Results Grid */}
      <div id="resources" tabIndex={-1} aria-label="Filtered resource results" className="resource-results grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Left Filter Sidebar (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24">
          <div className="p-6 rounded-[22px] bg-neutral-50/70 dark:bg-neutral-900/60 border border-[#E8E2D6] dark:border-neutral-800">
            <BrowseFilters
              maximumPrice={Math.max(3000,...resources.map(r=>r.price||0))}
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </div>

        {/* Results Main Area (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {hasSearch&&<h2 className="text-xl font-bold text-[#263577] dark:text-neutral-100">Search results for “{searchQuery.trim()}”</h2>}
          {/* Top Results Meta Bar: Active Filter Chips + Sort Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
            {/* Left: Active Chips & Result Count */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium mr-1 dark:text-neutral-300">
                Showing <strong className="text-neutral-900 dark:text-neutral-100">{filteredResources.length}</strong> resources
                <span className="block mt-1">{filteredResources.filter(r => r.type !== 'Video link' && r.type !== 'Article link').length} documents · {filteredResources.filter(r => r.type === 'Video link').length} videos · {filteredResources.filter(r => r.type === 'Article link').length} articles / web links</span>
              </span>

              {/* Active Filter Chips */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.span key="filter-search"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FF4A00]/10 text-[#FF4A00] border border-[#FF4A00]/20"
                  >
                    <span>&ldquo;{searchQuery}&rdquo;</span>
                    <button onClick={() => setSearchQuery('')} className="p-0.5 hover:opacity-75">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {activeCategory !== 'All' && (
                  <motion.span key="filter-category"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                  >
                    <span>Cat: {activeCategory}</span>
                    <button onClick={() => setActiveCategory('All')} className="p-0.5 hover:opacity-75">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {filters.type !== 'All' && (
                  <motion.span key="filter-type"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                  >
                    <span>Type: {filters.type}</span>
                    <button onClick={() => handleFilterChange({ type: 'All' })} className="p-0.5 hover:opacity-75">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {filters.price !== 'All' && (
                  <motion.span key="filter-price"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                  >
                    <span>Price: {filters.price}</span>
                    <button onClick={() => handleFilterChange({ price: 'All' })} className="p-0.5 hover:opacity-75">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {filters.minRating > 0 && (
                  <motion.span key="filter-rating"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                  >
                    <span>{filters.minRating}+ Stars</span>
                    <button onClick={() => handleFilterChange({ minRating: 0 })} className="p-0.5 hover:opacity-75">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {filters.year !== 'All' && (
                  <motion.span key="filter-year"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                  >
                    <span>{filters.year}</span>
                    <button onClick={() => handleFilterChange({ year: 'All' })} className="p-0.5 hover:opacity-75">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {filters.moduleCode !== 'All' && (
                  <motion.span key="filter-module"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#1E6FEB]/10 text-[#1E6FEB] border border-[#1E6FEB]/20"
                  >
                    <span>{filters.moduleCode}</span>
                    <button onClick={() => handleFilterChange({ moduleCode: 'All' })} className="p-0.5 hover:opacity-75">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
              </AnimatePresence>

              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-neutral-400 hover:text-[#FF4A00] underline underline-offset-2 ml-1"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="text-neutral-400 font-semibold dark:text-neutral-300">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className="px-3.5 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#FF4A00]"
              >
                <option value="downloads">Most Downloaded</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Recently Added</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Results Grid / Shimmer / Empty State */}
          {isFiltering ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ResourceCardSkeleton key={idx} />
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <BrowseEmptyState onReset={handleResetFilters} />
          ) : (
            <>
              {/* 3-Column Desktop / 1-Column Mobile Results Grid with Framer Motion Layout */}
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {displayedItems.map((res) => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      isBookmarked={isBookmarked(res.id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-8 text-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                  >
                    <span>Load More Resources</span>
                    <span className="text-xs text-neutral-400 font-mono ml-1 dark:text-neutral-300">
                      ({filteredResources.length - visibleCount} remaining)
                    </span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Panel */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-in drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-4/5 max-w-sm h-full bg-white dark:bg-neutral-900 p-6 overflow-y-auto shadow-2xl z-10"
            >
              <BrowseFilters
                maximumPrice={Math.max(3000,...resources.map(r=>r.price||0))}
              filters={filters}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
                activeCount={activeFilterCount}
                onCloseMobile={() => setIsMobileDrawerOpen(false)}
              />

              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 mt-6">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => setIsMobileDrawerOpen(false)}
                >
                  Show {filteredResources.length} Results
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
