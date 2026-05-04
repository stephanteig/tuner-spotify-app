import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-secondary font-medium">{label}</label>
      )}
      <input
        className={`
          w-full bg-elevated border border-border rounded-lg px-4 py-2
          text-white text-sm placeholder:text-muted
          focus:outline-none focus:border-primary
          transition-colors
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
