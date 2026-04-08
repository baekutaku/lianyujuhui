import { redirect } from "next/navigation";

type AdminCardSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminCardSlugPage({
  params,
}: AdminCardSlugPageProps) {
  const { slug } = await params;

  redirect(`/admin/cards/${slug}/edit`);
}
