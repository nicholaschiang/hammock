import { FormEvent, useCallback } from 'react';
import cn from 'classnames';

import SelectIcon from 'components/icons/select';

export interface SelectProps<T extends string> {
  options: { value: T; label?: string; icon?: JSX.Element }[];
  label: string;
  small?: boolean;
  value: T;
  onChange: (value: T) => void;
}

export default function Select<T extends string>({
  options,
  label,
  small,
  value,
  onChange,
}: SelectProps<T>): JSX.Element {
  const onChangeCallback = useCallback(
    (e: FormEvent<HTMLSelectElement>) => onChange(e.currentTarget.value as T),
    [onChange]
  );

  return (
    <label>
      <div className='select'>
        <span className='prefix'>
          {options.find((o) => o.value === value)?.icon}
        </span>
        <select
          value={value}
          onChange={onChangeCallback}
          className={cn({ small })}
          aria-label={label}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label || opt.value}
            </option>
          ))}
        </select>
        <span className='suffix'>
          <SelectIcon />
        </span>
      </div>
      <style jsx>{`
        .select {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--on-background);
        }

        span {
          display: inline-flex;
          position: absolute;
          pointer-events: none;
        }

        span.prefix {
          left: 12px;
        }

        span.suffix {
          right: 12px;
        }

        select {
          font: inherit;
          outline: none;
          appearance: none;
          font-size: 0.875rem;
          height: 40px;
          line-height: 1.25rem;
          text-rendering: auto;
          width: 100%;
          border-radius: 5px;
          border: 1px solid var(--accents-2);
          background: var(--background);
          color: var(--on-background);
          padding: 0 12px;
          padding-right: 36px;
          transition: border-color 0.15s ease;
        }

        span.prefix + select {
          padding-left: 36px;
        }

        select.small {
          font-size: 0.875rem;
          height: 32px;
        }
      `}</style>
    </label>
  );
}
