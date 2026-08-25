import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import {
  authService,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.service.js';
import {
  registrationService,
  registerStudentSchema,
  registerAgentSchema,
} from './auth.registration.service.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password, portal } = loginSchema.parse(req.body);
  const result = await authService.login(email, password, portal, req);

  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('refreshToken', result.refreshToken, {
    ...cookieBase,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  // Enables authenticated <img src="/uploads/..."> via cookie (Bearer still used for API)
  res.cookie('accessToken', result.accessToken, {
    ...cookieBase,
    maxAge: 60 * 60 * 1000,
  });

  sendSuccess(res, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    portal: result.portal,
    defaultRoute: result.defaultRoute,
  }, 'Login successful');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  refreshSchema.parse({ refreshToken: token });
  const result = await authService.refresh(token);
  if (result.accessToken) {
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });
  }
  sendSuccess(res, result, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  await authService.logout(req.user.id, token, req);
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  sendSuccess(res, null, 'Logged out successfully');
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, user);
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await authService.updatePreferences(req.user.id, req.body, req);
  sendSuccess(res, user, 'Preferences updated');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.user.id, data, req);
  sendSuccess(res, user, 'Profile updated');
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await authService.uploadAvatar(
    req.user.id,
    req.file,
    req.avatarRelativeDir,
    req,
  );
  sendSuccess(res, user, 'Profile photo updated');
});

export const removeAvatar = asyncHandler(async (req, res) => {
  const user = await authService.removeAvatar(req.user.id, req);
  sendSuccess(res, user, 'Profile photo removed');
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user.id, data, req);
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  sendSuccess(res, { requiresRelogin: true }, 'Password changed. Please sign in again.');
});

export const getRegistrationBranches = asyncHandler(async (req, res) => {
  const companyCode = String(req.query.companyCode || '').trim();
  const data = await registrationService.listBranches(companyCode);
  sendSuccess(res, data);
});

export const registerStudent = asyncHandler(async (req, res) => {
  const data = registerStudentSchema.parse(req.body);
  const result = await registrationService.registerStudent(data, req);
  sendSuccess(
    res,
    {
      userId: result.user.id,
      studentId: result.student.id,
      studentCode: result.student.studentCode,
      email: result.user.email,
    },
    'Student account created. You can now sign in.',
    201,
  );
});

export const registerAgent = asyncHandler(async (req, res) => {
  const data = registerAgentSchema.parse(req.body);
  const result = await registrationService.registerAgent(data, req);
  sendSuccess(
    res,
    {
      userId: result.user.id,
      partnerId: result.partner.id,
      partnerCode: result.partner.code,
      email: result.user.email,
    },
    'Agent account created. You can now sign in.',
    201,
  );
});
