import { ok, withRoute } from "@/lib/api/response.ts";
import * as authService from "@/lib/services/authService.ts";

export async function POST() {
  return withRoute(async () => {
    const response = ok({ message: "Logged out successfully" });
    authService.logout(response);
    return response;
  });
}
