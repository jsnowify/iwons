"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ALGORITHM_REGISTRY,
  CATEGORIES_LIST,
  ENGINES_LIST,
} from '../registry';
import { Search, ArrowRight } from 'lucide-react';

export function VisualizerCatalogView() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');

  const filteredAlgorithms = useMemo(() => {
    return ALGORITHM_REGISTRY.filter(algo => {
      // Category filter
      if (selectedCategory !== 'all' && algo.category !== selectedCategory) {
        return false;
      }

      // Engine filter
      if (selectedEngine !== 'all' && algo.engine !== selectedEngine) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = algo.name.toLowerCase().includes(q);
        const matchesBlurb = algo.blurb.toLowerCase().includes(q);
        const matchesTime = Object.values(algo.complexity).some(c => c.toLowerCase().includes(q));
        if (!matchesName && !matchesBlurb && !matchesTime) {
          return false;
        }
      }

      return true;
    });
  }, [search, selectedCategory, selectedEngine]);

  return (
    <div className="visualizer-catalog-container" data-theme-surface="paper">
      {/* Search & Filter Header Section */}
      <section className="catalog-search-filter-section" aria-label="Catalog filters">
        <div className="catalog-search-row">
          <label htmlFor="catalog-search" className="visually-hidden">
            Search algorithms
          </label>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', color: 'var(--muted)', pointerEvents: 'none' }}
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by algorithm name, description, or complexity (e.g. O(log n), Dijkstra, Heap)..."
              className="catalog-search-input"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <label htmlFor="engine-select" className="visually-hidden">
            Filter by engine
          </label>
          <select
            id="engine-select"
            value={selectedEngine}
            onChange={e => setSelectedEngine(e.target.value)}
            className="catalog-select-engine"
          >
            <option value="all">All Engines (6)</option>
            {ENGINES_LIST.map(eng => (
              <option key={eng.id} value={eng.id}>
                {eng.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter Pills */}
        <div className="catalog-category-pills" role="tablist" aria-label="Algorithm categories">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`category-pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            All Categories ({ALGORITHM_REGISTRY.length})
          </button>
          {CATEGORIES_LIST.map(cat => {
            const count = ALGORITHM_REGISTRY.filter(a => a.category === cat.id).length;
            if (count === 0) return null;

            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Status & Counter Strip */}
        <div className="catalog-counter-strip">
          <span>
            SHOWING {filteredAlgorithms.length} OF {ALGORITHM_REGISTRY.length} ALGORITHMS
          </span>
          {(search || selectedCategory !== 'all' || selectedEngine !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedEngine('all');
              }}
              className="dock-btn secondary"
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Algorithm Cards Grid */}
      <section className="catalog-cards-grid" aria-label="Available algorithms">
        {filteredAlgorithms.map(algo => {
          const categoryMeta = CATEGORIES_LIST.find(c => c.id === algo.category);
          const engineMeta = ENGINES_LIST.find(e => e.id === algo.engine);

          return (
            <article key={algo.id} className="algo-card">
              <div className="algo-card-top">
                <div className="algo-card-badges">
                  <span className="badge-cat">{categoryMeta?.label ?? algo.category}</span>
                  <span className="badge-engine">{engineMeta?.label ?? algo.engine}</span>
                </div>

                <h2 className="algo-card-title">{algo.name}</h2>
                <p className="algo-card-blurb">{algo.blurb}</p>
              </div>

              <div className="algo-card-footer">
                <div className="algo-card-complexities">
                  <span>Time: {algo.complexity.average}</span>
                  <span style={{ margin: '0 4px', color: 'var(--muted)' }}>·</span>
                  <span>Space: {algo.complexity.space}</span>
                </div>

                <Link
                  href={`/visualizer/${algo.id}/`}
                  className="algo-card-action"
                  title={`Open interactive visualizer for ${algo.name}`}
                >
                  <span>Launch</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default VisualizerCatalogView;
