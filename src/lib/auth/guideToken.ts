import { SignJWT } from "jose";
import { useAuthStore } from "@/stores/authStore";
import { EXTERNAL_LINKS } from "@/config/env.config";

const GUIDE_JWT_SECRET =
  import.meta.env.VITE_GUIDE_JWT_SECRET || "quocnam-guide-default-secret";

/**
 * Tạo JWT token chứa roles của user hiện tại
 * để gửi sang trang Cẩm nang (guide)
 */
async function createGuideToken(): Promise<string> {
  const user = useAuthStore.getState().user;
  const roles: string[] = user?.roles ?? [];

  const secret = new TextEncoder().encode(GUIDE_JWT_SECRET);

  const ROLE_CLAIM =
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

  const token = await new SignJWT({ [ROLE_CLAIM]: roles })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  return token;
}

/**
 * Mở trang Cẩm nang với JWT token chứa roles
 */
export async function openGuideWithToken(): Promise<void> {
  const token = await createGuideToken();
  const baseUrl = EXTERNAL_LINKS.guideUrl;
  const url = `${baseUrl}?t=${encodeURIComponent(token)}`;
  console.log("devtest", url, encodeURIComponent(token));
  window.open(url, "_blank", "noopener,noreferrer");
}
