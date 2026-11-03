/** Resolve profile photo file path from student + linked enquiry documents. */

function isPhotoDoc(doc) {
  if (!doc) return false;
  const cat = String(doc.category || '').toUpperCase();
  if (['PHOTO', 'PASSPORT_PHOTO', 'PHOTOGRAPH', 'PROFILE_PIC'].includes(cat)) return true;
  const name = String(doc.name || doc.fileName || doc.filePath || '').toLowerCase();
  if (name.includes('photo') || name.includes('profile') || name.includes('avatar') || name.includes('photograph')) {
    if (String(doc.mimeType || '').startsWith('image/')) return true;
    if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.fileName || doc.name || doc.filePath || '')) return true;
  }
  return false;
}

export function resolveEnquiryPhotoPath(enquiry) {
  if (!enquiry) return null;
  if (enquiry.photoUrl) return enquiry.photoUrl;
  if (enquiry.metadata?.photoUrl) return enquiry.metadata.photoUrl;

  const docs = Array.isArray(enquiry.documents) ? enquiry.documents : [];
  const photo = docs.find(isPhotoDoc) || docs.find((d) => String(d.category || '').toUpperCase() === 'PHOTO');
  return photo?.filePath || null;
}

export function resolveStudentPhotoPath(student) {
  if (!student) return null;
  if (student.photoUrl) return student.photoUrl;
  if (student.metadata?.photoUrl) return student.metadata.photoUrl;

  const studentDocs = Array.isArray(student.documents) ? student.documents : [];
  const studentPhoto = studentDocs.find(isPhotoDoc) || studentDocs.find((d) => String(d.category || '').toUpperCase() === 'PHOTO');
  if (studentPhoto?.filePath) return studentPhoto.filePath;

  const fromEnquiry = resolveEnquiryPhotoPath(student.enquiry);
  if (fromEnquiry) return fromEnquiry;

  if (student.user?.avatar) return student.user.avatar;
  return null;
}

export function attachStudentPhotoUrl(student) {
  if (!student) return student;
  const photoUrl = resolveStudentPhotoPath(student);
  return photoUrl ? { ...student, photoUrl } : student;
}

