import { redirect } from "next/navigation";
import { getCustomSession } from "@/lib/session";

export default async function SettingsPage() {
  const user = await getCustomSession();
  if (!user) redirect("/login");

  return <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Rajveer Travels</p><h1 className="mt-2 text-3xl font-bold text-gray-900">Settings</h1><p className="mt-2 text-gray-500">Manage your account and sign-in options.</p><div className="mt-8 divide-y rounded-2xl border border-gray-200 bg-white shadow-sm"><a href="/profile" className="flex items-center justify-between p-5 hover:bg-gray-50"><span><strong className="block text-gray-900">Profile</strong><span className="text-sm text-gray-500">Update your personal information and verification.</span></span><span className="text-brand-700">Open</span></a><a href="/api/logout" className="flex items-center justify-between p-5 text-red-700 hover:bg-red-50"><span><strong className="block">Log out</strong><span className="text-sm text-red-600">End your current session.</span></span><span>Sign out</span></a></div></section>;
}