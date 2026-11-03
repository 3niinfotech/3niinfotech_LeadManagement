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
      <div className="crm-staff-avatar-wrapper relative inline-flex flex-shrink-0">
        <Avatar
          name={name}
          src={avatarUrl}
          size={size}
          className="ring-4 ring-white dark:ring-slate-800 shadow-md transition-transform duration-200"
        />

        {canEdit && (
          <div className="crm-staff-avatar-actions absolute -bottom-1 -right-1 flex items-center gap-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs p-1 rounded-full shadow-md border border-slate-200/80 dark:border-slate-700 z-10">
            <button
              type="button"
              className="crm-avatar-action-btn crm-avatar-action-btn--upload w-7 h-7 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
              title="Upload / Change photo"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || removing}
            >
              <FiCamera size={13} />
            </button>

            {avatar && (
              <button
                type="button"
                className="crm-avatar-action-btn crm-avatar-action-btn--remove w-7 h-7 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-all shadow-xs cursor-pointer"
                title="Remove photo"
                onClick={handleRemove}
                disabled={uploading || removing}
              >
                <FiTrash2 size={12} />
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
