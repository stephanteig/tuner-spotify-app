import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-lg p-4 hover:bg-elevated transition-colors cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
