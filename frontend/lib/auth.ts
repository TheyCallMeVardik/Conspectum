import api from "./api";

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiry: string;
  userId: string;
  email: string;
}

export async function register(
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ email: string }> {
  const { data } = await api.post("/api/auth/register", {
    email,
    password,
    confirmPassword,
  });
  return data.data;
}

export async function verifyEmail(code: string): Promise<AuthResponse> {
  const { data } = await api.post("/api/auth/verify-email", { code });
  return data.data;
}

export async function resendVerification(email: string): Promise<void> {
  await api.post("/api/auth/resend-verification", { email });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/api/auth/forgot-password", { email });
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await api.post("/api/auth/reset-password", { email, code, newPassword });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
  localStorage.removeItem("accessToken");
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.put("/api/auth/password", { currentPassword, newPassword });
}

export async function deleteAccount(): Promise<void> {
  await api.delete("/api/auth/account");
  localStorage.removeItem("accessToken");
}
