import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { courseCounsellorMappingService } from './courseCounsellorMapping.service.js';
import { courseCounsellorResolveSchema } from './courseCounsellorMapping.validators.js';

export const listCourseCounsellorMappings = asyncHandler(async (req, res) => {
  const data = await courseCounsellorMappingService.list(req.user, req.query);
  sendSuccess(res, data);
});

export const createCourseCounsellorMapping = asyncHandler(async (req, res) => {
  const data = await courseCounsellorMappingService.create(req.body, req.user.id, req.user);
  sendSuccess(res, data, 'Course counsellor mapping created', 201);
});

export const updateCourseCounsellorMapping = asyncHandler(async (req, res) => {
  const data = await courseCounsellorMappingService.update(
    req.params.id,
    req.body,
    req.user.id,
    req.user,
  );
  sendSuccess(res, data, 'Course counsellor mapping updated');
});

export const deleteCourseCounsellorMapping = asyncHandler(async (req, res) => {
  await courseCounsellorMappingService.remove(req.params.id, req.user.id, req.user);
  sendSuccess(res, null, 'Course counsellor mapping removed');
});

export const resolveCourseCounsellor = asyncHandler(async (req, res) => {
  const query = courseCounsellorResolveSchema.parse(req.query);
  const data = await courseCounsellorMappingService.resolve({
    courseLabel: query.courseLabel,
    branchId: query.branchId || req.user.branchId,
    user: req.user,
  });
  sendSuccess(res, data);
});
