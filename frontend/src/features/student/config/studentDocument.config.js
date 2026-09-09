import { getDocumentUrl } from '../../enquiry/config/enquiryDocument.config';

function isImageDocument(doc) {
  if (!doc) return false;
  if (String(doc.mimeType || '').startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.fileName || doc.name || doc.filePath || '');
}

function isPhotoDoc(doc) {
  if (!doc) return false;
  if (String(doc.category || '').toUpperCase() !== 'PHOTO') return false;
  return isImageDocument(doc) || Boolean(doc.filePath);
}

/** Resolve profile photo URL from student record, documents, or linked enquiry. */
export function resolveStudentPhotoUrl(student) {
  if (!student) return null;

  const direct = getDocumentUrl(student.photoUrl || student.metadata?.photoUrl);
  if (direct) {
    const stamp = student.updatedAt || student.id || '';
    return `${direct}${direct.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(stamp))}`;
  }

  const docs = Array.isArray(student.documents) ? student.documents : [];
  const photos = docs.filter((d) => String(d.category || '').toUpperCase() === 'PHOTO');
  const photo = photos.find(isImageDocument) || photos[0];
  const fromDoc = getDocumentUrl(photo?.filePath || photo?.url || null);
  if (fromDoc) {
    const stamp = photo?.updatedAt || photo?.createdAt || photo?.id || '';
    return `${fromDoc}${fromDoc.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(stamp))}`;
  }

  const enquiryDocs = Array.isArray(student.enquiry?.documents) ? student.enquiry.documents : [];
  const enquiryPhotos = enquiryDocs.filter((d) => String(d.category || '').toUpperCase() === 'PHOTO');
  const enquiryPhoto = enquiryPhotos.find(isImageDocument) || enquiryPhotos[0];
  const fromEnquiry = getDocumentUrl(enquiryPhoto?.filePath || student.enquiry?.photoUrl || null);
  if (!fromEnquiry) return null;
  const stamp = enquiryPhoto?.updatedAt || enquiryPhoto?.createdAt || enquiryPhoto?.id || '';
  return `${fromEnquiry}${fromEnquiry.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(stamp))}`;
}
