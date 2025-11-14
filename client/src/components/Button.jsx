export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) {
  const baseClasses = 'rounded-lg font-medium smooth-animation disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary text-accent hover:bg-primary-dark',
    secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-accent',
    success: 'bg-success text-white hover:bg-green-600',
    warning: 'bg-warning text-white hover:bg-orange-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}
