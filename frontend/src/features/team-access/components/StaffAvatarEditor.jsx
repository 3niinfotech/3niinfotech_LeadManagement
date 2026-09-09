import { useRef, useState } from 'react';
import { FiCamera, FiTrash2 } from 'react-icons/fi';
import Avatar from '../../../components/ui/Avatar';
import AvatarCropModal from '../../../components/profile/AvatarCropModal';
import { resolvePublicAssetUrl } from '../../../config/company-settings.config';
import { staffApi, getUserApiError } from '../../master/services/staffApi.service';
import toastService from '../../../services/toast/toast.service';

export default function StaffAvatarEditor({
  userId,
  name,
  avatar,
  size = '2xl',
  canEdit = false,
  onUpdated,
}) {
  const fileRef = useRef(null);
  const [cropFile, setCropFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const avatarUrl = resolvePublicAssetUrl(avatar);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastService.error('Use JPG, PNG, or WEBP');
      return;
    }
    setCropFile(file);
  };

  const handleSave = async (file) => {
    if (!userId || !onUpdated) return;
    setUploading(true);
    try {
      const updated = await staffApi.uploadAvatar(userId, file);
      toastService.success('Profile photo updated');
      setCropFile(null);
      onUpdated(updated);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!userId || !onUpdated || !avatar) return;
    setRemoving(true);
    try {
      const updated = await staffApi.removeAvatar(userId);
      toastService.success('Profile photo removed');
      onUpdated(updated);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Could not remove photo');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <div className={`crm-staff-avatar crm-staff-avatar--${size}`}>
        <Avatar name={name} src={avatarUrl} size={size} className="crm-staff-avatar__img ring-4 ring-white shadow-md" />
        {canEdit && (
          <div className="crm-staff-avatar__actions">
            <button
              type="button"
              className="crm-staff-avatar__btn"
              title="Change photo"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || removing}
            >
              <FiCamera size={14} />
            </button>
            {avatar && (
              <button
                type="button"
                className="crm-staff-avatar__btn crm-staff-avatar__btn--danger"
                title="Remove photo"
                onClick={handleRemove}
                disabled={uploading || removing}
              >
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickFile} />
      </div>

      <AvatarCropModal
        file={cropFile}
        open={Boolean(cropFile)}
        uploading={uploading}
        onClose={() => setCropFile(null)}
        onSave={handleSave}
      />
    </>
  );
}
