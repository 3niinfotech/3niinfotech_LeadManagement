import { IMAGES } from '../../config/assets';

/** Error page skydiver illustration */
export default function ErrorIllustration({ className = '' }) {
  return (
    <img
      src={IMAGES.errors.somethingWentWrong}
      alt=""
      className={className}
      draggable={false}
      aria-hidden
    />
  );
}
