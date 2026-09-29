import { LogoWithText } from "@/components/Logo";

export default function LoginPage() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-purple-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LogoWithText className="justify-center" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">Log in to your Rajveer Travels account</p>
        </div>

        <form action="/api/login" method="POST" className="bg-white rounded-xl shadow-md p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required name="email" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="john@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required name="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Enter your password" />
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 rounded-lg transition-colors">
            Log in
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/register" className="text-brand-600 hover:underline font-medium">
              Register
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}