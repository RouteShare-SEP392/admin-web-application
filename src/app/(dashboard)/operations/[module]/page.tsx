import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { AdminModuleDesign } from "@/components/admin-module-design";
import { ADMIN_MODULES } from "@/lib/admin-modules";

export function generateStaticParams() {
  return ADMIN_MODULES.map((module) => ({ module: module.slug }));
}

type PageProps = { params: Promise<{ module: string }> };

export default function Page({ params }: PageProps) {
  return <Suspense fallback={<TableSkeleton />}><ModuleContent params={params} /></Suspense>;
}

async function ModuleContent({ params }: PageProps) {
  const { module: slug } = await params;
  const definition = ADMIN_MODULES.find((item) => item.slug === slug);
  if (!definition) notFound();
  return <AdminModuleDesign key={definition.slug} module={definition} />;
}
