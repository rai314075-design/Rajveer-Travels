import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCustomSession } from "@/lib/session";
import BookingHistory from "./BookingHistory";

export default async function ProfilePage() {
  const sessionUser = await getCustomSession();
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      phone: true,
      phoneVerified: true,
      emailVerified: true,
      address: true,
      language: true,
      role: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  if (!user) redirect("/");

  const hindi = user.language === "HINDI";

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Rajveer Travels</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{hindi ? "बुकिंग इतिहास" : "Booking history"}</h1>
          <p className="mt-2 text-gray-500">{hindi ? "आपकी सभी यात्राओं और बुकिंगों की विवरण।" : "View all your trips and booking details."}</p>
        </div>
        <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
          {hindi ? `${user._count.bookings} बुकिंग` : `${user._count.bookings} bookings`}
        </div>
      </div>
      <BookingHistory hindi={hindi} />
    </section>
  );
}