import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminPhoneItemIdPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/phone-items/${id}/edit`);
}