import { successResponse } from '../utils/response';

export const buildLoginResponse = (
  user: any,
  token: string,
  sessionId: string,
  createdAt: string,
  fcm_token: string
) => {
  return successResponse("Login successful", {
    token,
    sessionId,
    createdAt,
    user: {
      id: user._id?.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone ?? "919000000002",
      avatar: user.avatar,
      status: user.status,
      fcm_token,

      role: user.role,
      roleDescription:
        user.role === "Admin"
          ? "Admin access with most permissions"
          : "User with limited access",

      control:
        user.role === "Admin"
          ? "full_control"
          : "limited_control",

      accessLevel:
        user.role === "Admin" ? "high" : "low",

      permissions: [],
      isActive: true,
      isSystem: true,
    },
  });
};