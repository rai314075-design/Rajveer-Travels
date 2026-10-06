import type { Metadata } from "next";
import { getCustomSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import HeaderNav from "@/components/HeaderNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rajveer Travels",
  description: "Book bus tickets across India with Rajveer Travels",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getCustomSession();
  const user = sessionUser
    ? await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true, language: true },
      })
    : null;

  return (
    <html lang="en">
      <body>
        <header className="bg-[#C84310] text-white">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-7 sm:px-6">
            <a href="/" className="text-xl font-bold tracking-tight">
              Rajveer Travels
            </a>
            <HeaderNav sessionUser={!!sessionUser} user={user} />
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
