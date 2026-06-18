import VerifyEmailInner from "./VerifyEmailInner";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params?.email || "";

  return <VerifyEmailInner initialEmail={email} />;
}