import { redirect } from "next/navigation";
import { authRoutes } from "@/constants/auth";

export default function RootPage() {
  redirect(authRoutes.home);
}
