import { Search, X } from 'lucide-react';

export interface SegmentedTabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedTabsProps<T extends string = string> {
  items: SegmentedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string = string>({
  items,
  value,
  onChange,
  className = '',
}: SegmentedTabsProps<T>) {
  const gridCols =
    items.length === 4 ? 'grid-cols-4' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div
      role="tablist"
      className={`grid ${gridCols} gap-[3px] p-[3px] bg-surface border border-line rounded-[12px] ${className}`}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`border-none rounded-[9px] py-[9px] px-1 flex flex-col items-center justify-center gap-[2px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
              active ? 'bg-brand-soft text-brand' : 'bg-transparent text-dim hover:text-ink'
            }`}
          >
            <span className="text-[12px] font-bold leading-none truncate max-w-full">
              {item.label}
            </span>
            {typeof item.count === 'number' && (
              <b
                className={`font-mono text-[14px] font-semibold leading-tight ${
                  active ? 'text-brand' : 'text-ink'
                }`}
              >
                {item.count}
              </b>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface FilterChipItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

interface FilterChipsProps<T extends string = string> {
  items: FilterChipItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterChips<T extends string = string>({
  items,
  value,
  onChange,
  className = '',
}: FilterChipsProps<T>) {
  return (
    <div className={`flex gap-[7px] overflow-x-auto no-scrollbar pb-[2px] ${className}`}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`shrink-0 border rounded-full px-3 py-2 text-[12px] font-bold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
              active
                ? 'bg-brand-soft border-brand text-brand'
                : 'bg-surface border-line text-dim hover:text-ink'
            }`}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <b className={`font-mono font-semibold ml-1 ${active ? 'text-brand' : 'text-ink'}`}>
                {item.count}
              </b>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: 'default' | 'tall';
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  className = '',
  height = 'default',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-faint absolute left-[13px] top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${
          height === 'tall' ? 'h-[46px]' : 'h-[44px]'
        } pl-[38px] pr-9 rounded-[12px] border border-line bg-surface text-ink text-[14px] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-1`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-faint hover:text-ink absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
