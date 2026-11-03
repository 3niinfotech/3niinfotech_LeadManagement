import { useEffect, useState } from 'react';
import { FiUser } from 'react-icons/fi';
import { getDocumentUrl } from '../../features/enquiry/config/enquiryDocument.config';

const sizes = {
  '2xs': 'w-5 h-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px] text-[8.5px]',
  xs: 'w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] text-[10px]',
  sm: 'w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] text-xs',
  md: 'w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] text-sm',
  lg: 'w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] text-base',
  xl: 'w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] text-lg',
  '2xl': 'w-20 h-20 min-w-[80px] min-h-[80px] max-w-[80px] max-h-[80px] text-xl',
};

function getInitials(name = '') {
  const parts = String(name)
    .trim()
    .split(' ')
    .filter(Boolean);
  if (!parts.length) return '';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function Avatar({ name = '', src = '', size = 'sm', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const rawUrl = src && typeof src === 'string' && src.trim() ? src.trim() : '';
  const resolvedSrc = rawUrl ? (getDocumentUrl(rawUrl) || rawUrl) : '';
  const showImage = Boolean(resolvedSrc) && !imgFailed;
  const initials = getInitials(name);
  const sizeClass = sizes[size] || sizes.sm;

  return (
    <div
      className={`rounded-full aspect-square flex items-center justify-center overflow-hidden shrink-0 select-none ${
        showImage
          ? 'bg-primary-100 dark:bg-primary-900/40 ring-1 ring-black/5'
          : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white font-bold tracking-tight shadow-sm'
      } ${sizeClass} ${className}`}
    >
      {showImage ? (
        <img
          key={resolvedSrc}
          src={resolvedSrc}
          alt={name || 'Profile'}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgFailed(true)}
        />
      ) : initials ? (
        <span aria-hidden className="select-none leading-none font-bold uppercase">
          {initials}
        </span>
      ) : (
        <FiUser className="w-1/2 h-1/2 text-white/90" aria-hidden />
      )}
    </div>
  );
}
