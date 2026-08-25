import { motion } from 'framer-motion';
import { FiCamera, FiTrash2 } from 'react-icons/fi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function AvatarPreviewModal({
  open,
  src,
  name,
  removing,
  onClose,
  onChange,
  onRemove,
}) {
  return (
    <Modal
      open={open}
      onClose={removing ? undefined : onClose}
      title="Profile photo"
      subtitle={name}
      size="sm"
      compact
      footer={(
        <div className="flex w-full items-center justify-center gap-2">
          <Button size="sm" variant="outline" icon={FiCamera} onClick={onChange} disabled={removing}>
            Change
          </Button>
          <Button size="sm" variant="outline-danger" icon={FiTrash2} loading={removing} onClick={onRemove}>
            Delete
          </Button>
        </div>
      )}
    >
      <div className="flex justify-center p-4">
        <motion.img
          key={src}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          src={src}
          alt={name || 'Profile photo'}
          className="h-56 w-56 rounded-full object-cover shadow-lg ring-4 ring-page"
        />
      </div>
    </Modal>
  );
}
