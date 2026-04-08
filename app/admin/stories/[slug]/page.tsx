import { redirect } from "next/navigation";

type AdminStorySlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminStorySlugPage({
  params,
}: AdminStorySlugPageProps) {
  const { slug } = await params;

  redirect(`/admin/stories/${slug}/edit`);
}
