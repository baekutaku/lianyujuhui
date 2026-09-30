import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminEventSlugPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/admin/events/${slug}/edit`);
}