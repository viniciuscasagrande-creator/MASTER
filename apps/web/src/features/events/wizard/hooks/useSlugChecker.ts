import { useState, useEffect, useRef } from 'react';
import { checkSlugAvailability } from '../../api/events.api';

export interface UseSlugCheckerReturn {
  slug: string;
  setSlug: (val: string) => void;
  isChecking: boolean;
  isAvailable: boolean | null;
  suggestedSlug: string | null;
  error: string | null;
  applySuggestedSlug: () => void;
}

export function useSlugChecker(
  initialSlug: string,
  excludeEventId?: string,
  onValidSlugSelected?: (slug: string) => void
): UseSlugCheckerReturn {
  const [slug, setSlug] = useState<string>(initialSlug || '');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (initialSlug && !slug) {
      setSlug(initialSlug);
    }
  }, [initialSlug, slug]);

  useEffect(() => {
    if (!slug || slug.trim().length < 2) {
      setIsAvailable(null);
      setSuggestedSlug(null);
      setError(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsChecking(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await checkSlugAvailability(slug.trim(), excludeEventId);
        setIsAvailable(result.available);
        setSuggestedSlug(result.suggestedSlug || null);
        setError(null);
        if (result.available && onValidSlugSelected) {
          onValidSlugSelected(slug.trim());
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao verificar slug');
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [slug, excludeEventId, onValidSlugSelected]);

  const applySuggestedSlug = () => {
    if (suggestedSlug) {
      setSlug(suggestedSlug);
      if (onValidSlugSelected) {
        onValidSlugSelected(suggestedSlug);
      }
    }
  };

  return {
    slug,
    setSlug,
    isChecking,
    isAvailable,
    suggestedSlug,
    error,
    applySuggestedSlug
  };
}
