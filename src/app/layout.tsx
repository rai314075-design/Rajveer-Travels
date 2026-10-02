import type { Metadata } from "next";
import { getCustomSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import NotificationBell from "@/components/NotificationBell";
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
        <header className="flex min-h-20 w-full flex-col gap-3 bg-brand-700 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
          <a href="/" className="text-center text-lg font-bold tracking-tight sm:text-left sm:text-xl">
            Rajveer Travels
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:gap-6 sm:text-sm">
            <a href="/search" className="text-white font-bold hover:text-purple-200">{user?.language === "HINDI" ? "बस बुक करें" : "Book a Bus"}</a>
            {sessionUser ? (
              <>
                <a href="/support" className="text-white font-bold hover:text-purple-200">{user?.language === "HINDI" ? "सहायता" : "Help"}</a>
                {user?.role === "ADMIN" && <a href="/admin" className="text-white font-bold hover:text-purple-200">{user.language === "HINDI" ? "डैशबोर्ड" : "Dashboard"}</a>}
                <a href="/settings" className="text-white font-bold hover:text-purple-200">{user?.language === "HINDI" ? "सेटिंग्स" : "Settings"}</a>
                <NotificationBell hindi={user?.language === "HINDI"} />
              </>
            ) : (
              <a href="/login" className="font-bold text-white hover:text-purple-200">{user?.language === "HINDI" ? "लॉग इन" : "Login"}</a>
            )}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
