import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function ensureAdmin() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const user = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { role: true, isSuperAdmin: true },
  });

  if (user?.role !== "ADMIN") redirect("/");
  return user;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await ensureAdmin();

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-56 bg-gray-900 text-gray-200 p-4 space-y-2">
        <p className="text-xs uppercase text-gray-500 mb-2">Admin</p>
        <a href="/admin" className="block px-3 py-2 rounded hover:bg-gray-800 font-bold">Dashboard</a>
        <a href="/admin/buses" className="block px-3 py-2 rounded hover:bg-gray-800 font-bold">Buses</a>
        <a href="/admin/routes" className="block px-3 py-2 rounded hover:bg-gray-800 font-bold">Routes</a>
        <a href="/admin/trips" className="block px-3 py-2 rounded hover:bg-gray-800 font-bold">Trips & Dates</a>
        <a href="/admin/notifications" className="block px-3 py-2 rounded hover:bg-gray-800 font-bold">Notifications</a>
        <a href="/admin/support" className="block px-3 py-2 rounded hover:bg-gray-800 font-bold">Complaints & Refunds</a>
        {user?.isSuperAdmin && <a href="/admin/users" className="block px-3 py-2 rounded hover:bg-gray-800 font-bold">Manage Admins</a>}
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
