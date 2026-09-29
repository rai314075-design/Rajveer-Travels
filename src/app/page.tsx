import { getCustomSession } from "@/lib/session";

export default async function HomePage() {
  const user = await getCustomSession();
  const language = user?.language || "ENGLISH";
  const hindi = language === "HINDI";

  return (
    <section className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl font-bold mb-3">{hindi ? "राजवीर ट्रैवल्स के साथ यात्रा करें" : "Travel with Rajveer Travels"}</h1>
      <p className="text-gray-600 mb-8">{hindi ? "पूरे भारत में बसें खोजें। सुरक्षित, समय पर और आरामदायक।" : "Search buses across India. Safe, on-time, comfortable."}</p>

      <form action="/search" method="GET" className="grid sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow">
        <input name="source" placeholder={hindi ? "कहाँ से" : "From"} required className="border rounded-lg px-3 py-2 sm:col-span-1" />
        <input name="destination" placeholder={hindi ? "कहाँ तक" : "To"} required className="border rounded-lg px-3 py-2 sm:col-span-1" />
        <input name="date" type="date" required className="border rounded-lg px-3 py-2 sm:col-span-1" />
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 sm:col-span-1">
          {hindi ? "बस खोजें" : "Search Buses"}
        </button>
      </form>
    </section>
  );
}