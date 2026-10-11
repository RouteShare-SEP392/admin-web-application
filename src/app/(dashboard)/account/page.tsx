import type { Metadata } from "next";
import { AccountView } from "./view";

export const metadata: Metadata = { title: "Tài khoản của tôi" };

export default function AccountPage() {
  return <AccountView />;
}
