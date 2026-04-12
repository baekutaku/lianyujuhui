import { redirect } from "next/navigation";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function AdminPhoneItemIdPage({ params }: PageProps) {
  const id = params.id;
  redirect(`/admin/phone-items/${id}/edit`);
}