import type { Metadata } from "next";
import { UsersView } from "./view";

export const metadata: Metadata = { title: "Người dùng" };

export default function UsersPage() {
  return <UsersView />;
}
