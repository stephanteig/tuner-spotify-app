import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-primary hover:bg-primary-hover text-black font-semibold px-6 py-2 rounded-full',
    ghost: 'text-secondary hover:text-white',
    icon: 'text-secondary hover:text-white p-2 rounded-full hover:bg-elevated',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
