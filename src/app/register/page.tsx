import { LogoWithText } from "@/components/Logo";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// The API route at /api/register handles POST, so this page is just a UI.

export default function RegisterPage() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-purple-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LogoWithText className="justify-center" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">Join Rajveer Travels today</p>
        </div>

        <form
          action="/api/register"
          method="POST"
          className="bg-white rounded-xl shadow-md p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="john@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" required minLength={6} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="At least 6 characters" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input type="tel" name="phone" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="+91 98765 43210" />
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 rounded-lg transition-colors">
            Register
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-brand-600 hover:underline font-medium">
              Log in
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}