import React, { useState, useRef, useEffect } from 'react'

/**
 * Searchable product combobox.
 * Opens a panel with a search field; filters as you type.
 * Keyboard: ↑/↓ to move, Enter to select, Esc to close.
 */
export default function ProductSelect({ products, value, onChange, disabled, placeholder }) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [highlight, setHl]    = useState(0)

  const rootRef   = useRef(null)
  const searchRef = useRef(null)
  const listRef   = useRef(null)

  const filtered = query
    ? products.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : products

  // focus search field the moment the panel opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setHl(Math.max(0, products.indexOf(value)))
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // close on outside press (pointerdown = instant, not on release)
  useEffect(() => {
    if (!open) return
    const onDown = e => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // keep highlighted row in view
  useEffect(() => {
    listRef.current
      ?.children[highlight]
      ?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  function select(name) {
    onChange(name)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHl(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHl(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlight]) select(filtered[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="combo" ref={rootRef}>
      <button
        type="button"
        className={`combo-trigger${open ? ' open' : ''}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onPointerDown={e => {
          // respond on press, not release
          e.preventDefault()
          if (!disabled) setOpen(o => !o)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            if (!disabled) setOpen(true)
          }
        }}
      >
        <span className={value ? '' : 'combo-placeholder'}>
          {value || placeholder}
        </span>
        <svg className="combo-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="combo-panel" role="listbox">
          <div className="combo-search-wrap">
            <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true" className="combo-search-icon">
              <circle cx="5.5" cy="5.5" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8.8 8.8L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              className="combo-search"
              value={query}
              placeholder="Search products…"
              onChange={e => { setQuery(e.target.value); setHl(0) }}
              onKeyDown={onKeyDown}
            />
          </div>

          <ul className="combo-list" ref={listRef}>
            {filtered.length === 0 && (
              <li className="combo-empty">No products match “{query}”</li>
            )}
            {filtered.map((p, i) => (
              <li
                key={p}
                role="option"
                aria-selected={p === value}
                className={
                  'combo-option' +
                  (i === highlight ? ' highlighted' : '') +
                  (p === value ? ' selected' : '')
                }
                onPointerEnter={() => setHl(i)}
                onPointerDown={e => { e.preventDefault(); select(p) }}
              >
                <span className="combo-check" aria-hidden="true">
                  {p === value ? '✓' : ''}
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
