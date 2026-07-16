import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ horseId: string }> };

export default async function HorseEventsRedirect({ params }: PageProps) {
  const { horseId } = await params;
  redirect(`/horses/${horseId}/planning`);
}
