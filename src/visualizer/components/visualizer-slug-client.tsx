"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlgoDefinition } from '../core/types';
import { loadAlgorithmDefinition, getAlgorithmMetadata } from '../registry';
import { VisualizerShell } from './visualizer-shell';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface VisualizerSlugClientProps {
  slug: string;
}

export function VisualizerSlugClient({ slug }: VisualizerSlugClientProps) {
  const [algorithm, setAlgorithm] = useState<AlgoDefinition<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meta = getAlgorithmMetadata(slug);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    loadAlgorithmDefinition(slug)
      .then(algo => {
        if (!isMounted) return;
        if (!algo) {
          setError(`Algorithm "${slug}" could not be loaded or is not cataloged.`);
        } else {
          setAlgorithm(algo);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load algorithm definition.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="visualizer-loading-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px', color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Loading {meta?.name ?? slug}...</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Precomputing steps and preparing interactive stage.</p>
      </div>
    );
  }

  if (error || !algorithm) {
    return (
      <div className="visualizer-error-card" style={{ padding: '40px 24px', border: '2px solid var(--ink)', background: 'var(--surface)', margin: '20px auto', maxWidth: '600px', textAlign: 'center' }}>
        <AlertCircle size={36} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>Algorithm Unavailable</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
          {error ?? `Could not find an algorithm matching "${slug}".`}
        </p>
        <Link href="/visualizer/" className="dock-btn primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={14} />
          <span>Return to Algorithm Library</span>
        </Link>
      </div>
    );
  }

  return <VisualizerShell algorithm={algorithm} />;
}

export default VisualizerSlugClient;

