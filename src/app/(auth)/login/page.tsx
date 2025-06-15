import { LoginClient } from "@/components/auth/LoginClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return <LoginClient />;
}
