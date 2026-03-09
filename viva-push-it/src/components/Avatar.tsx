import { getAvatarUrl } from '../lib/apiClient';

interface AvatarProps {
  avatarUrl?: string | null;
  fullName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dark';
  className?: string;
}

const sizeClasses = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-24 h-24 text-3xl',
};

export function Avatar({ avatarUrl, fullName, size = 'md', variant = 'default', className = '' }: AvatarProps) {
  const src = getAvatarUrl(avatarUrl ?? undefined);
  const initial = (fullName || '?').charAt(0).toUpperCase();
  const sizeClass = sizeClasses[size];
  const placeholderClass = variant === 'dark'
    ? 'bg-primary-500 text-white'
    : 'bg-primary-100 text-primary-700';

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${placeholderClass} ${sizeClass} ${className}`}
    >
      {initial}
    </div>
  );
}
