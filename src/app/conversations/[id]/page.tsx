import { ConversationsView } from "@/components/conversations/conversations-view";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConversationsView id={id} />;
}
