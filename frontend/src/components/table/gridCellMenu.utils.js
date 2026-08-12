/** Keep grid cell dropdowns open while scrolling inside the menu; reposition on grid scroll */
export function handleGridCellMenuScroll(event, menuRef, updatePosition) {
  if (menuRef.current?.contains(event.target)) return;
  updatePosition?.();
}

export const gridCellMenuWheelProps = {
  onWheel: (e) => e.stopPropagation(),
};
