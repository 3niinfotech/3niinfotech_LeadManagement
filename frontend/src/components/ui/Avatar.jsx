import { useEffect, useState } from 'react';

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

export default function Avatar({ name = '', src = '', size = 'sm', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !imgFailed;
  const initials = getInitials(name);

  return (
    <div
      className={`rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center font-medium text-primary-700 dark:text-primary-300 overflow-hidden shrink-0 ${sizes[size]} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || 'Profile'}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
