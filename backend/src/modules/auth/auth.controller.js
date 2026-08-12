import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { authService, loginSchema, refreshSchema, updateProfileSchema } from './auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password, req);

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
