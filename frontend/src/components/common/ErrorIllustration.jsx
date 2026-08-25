import { IMAGES } from '../../config/assets';

/** Error page skydiver illustration */
export default function ErrorIllustration({ className = '' }) {
  return (
    <img
      src={IMAGES.errors.somethingWentWrong}
      alt="Something went wrong"
      className={className}
      draggable={false}
    />
  );
}
