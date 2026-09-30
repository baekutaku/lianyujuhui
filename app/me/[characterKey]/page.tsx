import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ characterKey: string }>;
};

export default async function MeCharacterRedirectPage({ params }: PageProps) {
  const { characterKey } = await params;
  redirect(`/phone-items/me/${characterKey}`);
}