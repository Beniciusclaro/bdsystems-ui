import './BrandLogo.scss';

interface BrandLogoProps {
  compact?: boolean;
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={`brand-logo${compact ? ' brand-logo--compact' : ''}`} aria-label="Edificações B&D">
      <span className="brand-logo__monogram" aria-hidden="true">
        <span>b</span><span className="brand-logo__ampersand">&amp;</span><span>d</span>
      </span>
      <span className="brand-logo__copy">
        <strong>EDIFICAÇÕES B&amp;D</strong>
        {!compact ? <small>Tirando da sua imaginação para torná-lo real</small> : null}
      </span>
    </div>
  );
}