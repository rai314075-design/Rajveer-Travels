import type { Metadata } from "next";
import { getCustomSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
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
        <header className="w-full min-h-20 bg-brand-700 text-white px-4 py-4 sm:px-8 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="text-lg sm:text-xl font-bold tracking-tight">
            Rajveer Travels
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:gap-6 sm:text-sm">
            <a href="/search" className="text-white font-bold hover:text-purple-200">{user?.language === "HINDI" ? "बस बुक करें" : "Book a Bus"}</a>
            {sessionUser ? (
              <>
                <a href="/support" className="text-white font-bold hover:text-purple-200">{user?.language === "HINDI" ? "सहायता" : "Help"}</a>
                {user?.role === "ADMIN" && <a href="/admin" className="text-white font-bold hover:text-purple-200">{user.language === "HINDI" ? "डैशबोर्ड" : "Dashboard"}</a>}
                <a href="/profile" className="text-white font-bold hover:text-purple-200">{user?.language === "HINDI" ? "प्रोफ़ाइल" : "Profile"}</a>
                <a href="/api/logout" className="font-bold text-white hover:text-purple-200">{user?.language === "HINDI" ? "लॉग आउट" : "Logout"}</a>
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
