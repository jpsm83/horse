import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ horseId: string }> };

export default async function HorseEditRedirect({ params }: PageProps) {
  const { horseId } = await params;
  redirect(`/horses/${horseId}/profile`);
}
