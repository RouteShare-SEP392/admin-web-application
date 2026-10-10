import Link from "next/link";
import { Avatar } from "./ui/misc";

interface Person {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** Ô "người dùng" trong bảng: ảnh đại diện, họ tên và một dòng liên hệ. */
export function PersonCell({ person, href }: { person: Person; href?: string }) {
  const contact = person.email ?? person.phone;
  return (
    <div className="flex min-w-44 items-center gap-3">
      <Avatar name={person.fullName} src={person.avatarUrl} />
      <div className="min-w-0 leading-tight">
        {href ? (
          <Link href={href} className="font-medium text-ink hover:text-brand-700 hover:underline">
            {person.fullName}
          </Link>
        ) : (
          <p className="font-medium">{person.fullName}</p>
        )}
        {contact ? <p className="truncate text-xs text-muted">{contact}</p> : null}
      </div>
    </div>
  );
}
