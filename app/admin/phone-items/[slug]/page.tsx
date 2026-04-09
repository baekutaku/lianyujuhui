import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function AdminPhoneItemSlugPage({ params }: PageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  redirect(`/admin/phone-items/${slug}/edit`);
}