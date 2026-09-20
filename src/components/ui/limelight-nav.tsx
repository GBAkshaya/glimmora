import React, { useState, useRef, useLayoutEffect, cloneElement } from 'react';

export type NavItem = {
  id: string | number;
  icon: React.ReactElement<{ className?: string }>;
  label?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  dropdown?: React.ReactNode;
};

type LimelightNavProps = {
  items: NavItem[];
  defaultActiveIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  itemWrapperClassName?: string;
};

/**
 * An adaptive-width navigation bar with a "limelight" effect that highlights the active item.
 */
export const LimelightNav = ({
  items,
  defaultActiveIndex = 0,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
  labelClassName,
  itemWrapperClassName,
}: LimelightNavProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  const currentIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;

  // Sync state if defaultActiveIndex changes (e.g. route changes)
  useLayoutEffect(() => {
    setActiveIndex(defaultActiveIndex);
  }, [defaultActiveIndex]);

  useLayoutEffect(() => {
    if (items.length === 0) return;

    const limelight = limelightRef.current;
    const nav = navRef.current;
    const targetItem = navItemRefs.current[currentIndex];

    if (limelight && targetItem && nav) {
      const navRect = nav.getBoundingClientRect();
      const targetRect = targetItem.getBoundingClientRect();
      const newLeft = targetRect.left - navRect.left + targetRect.width / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;

      if (!isReady) {
        setTimeout(() => setIsReady(true), 50);
      }
    }
  }, [currentIndex, isReady, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      const limelight = limelightRef.current;
      const nav = navRef.current;
      const targetItem = navItemRefs.current[currentIndex];
      if (limelight && targetItem && nav) {
        const navRect = nav.getBoundingClientRect();
        const targetRect = targetItem.getBoundingClientRect();
        const newLeft = targetRect.left - navRect.left + targetRect.width / 2 - limelight.offsetWidth / 2;
        limelight.style.left = `${newLeft}px`;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  if (items.length === 0) {
    return null;
  }

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    setActiveIndex(index);
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav
      ref={navRef}
      onMouseLeave={() => setHoveredIndex(null)}
      className={`relative inline-flex items-center h-12 rounded-lg text-charcoal ${className}`}
    >
      {items.map(({ id, icon, label, href, onClick, onMouseEnter, onMouseLeave, dropdown }, index) => (
        <div
          key={id}
          className="relative h-full flex items-center shrink-0"
          onMouseEnter={() => {
            setHoveredIndex(index);
            onMouseEnter?.();
          }}
          onMouseLeave={onMouseLeave}
        >
          <a
            ref={el => { navItemRefs.current[index] = el; }}
            href={href}
            className={`relative z-20 flex h-full cursor-pointer items-center justify-center px-2 md:px-5 ${iconContainerClassName || ''}`}
            onClick={(e) => {
              if (href && (e.ctrlKey || e.metaKey || e.shiftKey)) return;
              e.preventDefault();
              handleItemClick(index, onClick);
            }}
          >
            <div className={`flex items-center gap-1 sm:gap-2 ${itemWrapperClassName || ''}`}>
              {cloneElement(icon, {
                className: `w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ease-in-out shrink-0 ${currentIndex === index ? 'opacity-100 text-gold-dark scale-110' : 'opacity-60 text-charcoal'
                  } ${icon.props.className || ''} ${iconClassName || ''}`,
              })}
              {label && (
                <span className={`text-[11px] sm:text-xs md:text-sm tracking-tight sm:tracking-wide transition-all duration-300 ${currentIndex === index ? 'text-gold-dark font-medium' : 'text-charcoal/80'} ${labelClassName || ''}`}>{label}</span>
              )}
            </div>
          </a>
          {dropdown}
        </div>
      ))}

      <div
        ref={limelightRef}
        className={`absolute top-0 z-10 w-11 h-[3px] rounded-full bg-gold-dark shadow-[0_8px_20px_rgba(212,175,55,0.7)] transition-all duration-300 ease-out ${limelightClassName}`}
        style={{ opacity: isReady ? 1 : 0, left: '0px' }}
      >
        <div className="absolute left-[-40%] top-[3px] w-[180%] h-11 [clip-path:polygon(10%_100%,30%_0,70%_0,90%_100%)] bg-gradient-to-b from-gold/35 via-gold/15 to-transparent pointer-events-none" />
      </div>
    </nav>
  );
};
