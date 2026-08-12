import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import {
  authService,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
} from './auth.service.js';
import {
  registrationService,
  registerStudentSchema,
  registerAgentSchema,
} from './auth.registration.service.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password, portal } = loginSchema.parse(req.body);
  const result = await authService.login(email, password, portal, req);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
  sendSuccess(res, result, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  await authService.logout(req.user.id, token, req);
  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out successfully');
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, user);
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await authService.updatePreferences(req.user.id, req.body);
  sendSuccess(res, user, 'Preferences updated');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.user.id, data, req);
  sendSuccess(res, user, 'Profile updated');
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
