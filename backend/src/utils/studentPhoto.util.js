/** Resolve profile photo file path from student + linked enquiry documents. */

function isPhotoDoc(doc) {
  if (!doc) return false;
  if (String(doc.category || '').toUpperCase() !== 'PHOTO') return false;
  if (String(doc.mimeType || '').startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.fileName || doc.name || doc.filePath || '');
}

export function resolveEnquiryPhotoPath(enquiry) {
  if (!enquiry) return null;
  if (enquiry.metadata?.photoUrl) return enquiry.metadata.photoUrl;

  const docs = Array.isArray(enquiry.documents) ? enquiry.documents : [];
  const photo = docs.find(isPhotoDoc) || docs.find((d) => String(d.category || '').toUpperCase() === 'PHOTO');
  return photo?.filePath || null;
}

export function resolveStudentPhotoPath(student) {
  if (!student) return null;
  if (student.metadata?.photoUrl) return student.metadata.photoUrl;

  const studentDocs = Array.isArray(student.documents) ? student.documents : [];
  const studentPhoto = studentDocs.find(isPhotoDoc);
  if (studentPhoto?.filePath) return studentPhoto.filePath;

  return resolveEnquiryPhotoPath(student.enquiry);
}

export function attachStudentPhotoUrl(student) {
  if (!student) return student;
  const photoUrl = resolveStudentPhotoPath(student);
  return photoUrl ? { ...student, photoUrl } : student;
}
