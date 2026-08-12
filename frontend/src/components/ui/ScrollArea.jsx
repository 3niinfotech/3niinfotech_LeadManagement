const AXIS = {
  y: 'overflow-y-auto overflow-x-hidden',
  x: 'overflow-x-auto overflow-y-hidden',
  both: 'overflow-auto',
};

/**
 * Consistent scroll container — thin scrollbar, overscroll contain, touch momentum.
 * Use axis="y" for panels/drawers, axis="x" for stat strips/tabs, axis="both" for tables.
 */
export default function ScrollArea({
  children,
  axis = 'y',
  className = '',
  hideBar = false,
  as: Tag = 'div',
  ...props
}) {
  return (
    <Tag
      className={`scroll-area overscroll-contain ${hideBar ? 'no-scrollbar' : ''} ${AXIS[axis] || AXIS.y} ${className}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}
