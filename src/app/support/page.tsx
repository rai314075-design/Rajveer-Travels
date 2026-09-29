"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SupportPage() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState("SERVICE");
  const [message, setMessage] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [refundBookingId, setRefundBookingId] = useState(searchParams.get("bookingId") || "");
  const [upiId, setUpiId] = useState("");
  const [notice, setNotice] = useState("");
  const [hindi, setHindi] = useState(false);
  const [bookings, setBookings] = useState<Array<{ id: string; status: string; trip: { departureTime: string; arrivalTime: string; bus: { busNumber: string; ownerPhone?: string | null; pickupLocation?: string | null; dropLocation?: string | null }; route: { source: string; destination: string; pickupPoint?: string | null; dropPoint?: string | null } } }>>([]);

  useEffect(() => {
    fetch("/api/bookings").then((response) => response.ok ? response.json() : []).then(setBookings);
    fetch("/api/profile").then((response) => response.json()).then((data) => setHindi(data.language === "HINDI"));
  }, []);

  async function submitComplaint(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/support/complaints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, message, bookingId: bookingId || undefined }) });
    const data = await response.json();
    setNotice(response.ok ? "Complaint sent to the admin." : data.error);
    if (response.ok) setMessage("");
  }

  async function requestRefund(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/support/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: refundBookingId, upiId }) });
    const data = await response.json();
    setNotice(response.ok ? "Refund request sent to the admin." : data.error);
    if (response.ok) { setRefundBookingId(""); setUpiId(""); }
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-3xl font-bold">{hindi ? "सहायता और समर्थन" : "Help & Support"}</h1>
      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">{hindi ? "मेरी बुकिंग" : "My bookings"}</h2>
        <p className="text-sm text-gray-600">{hindi ? "रद्द करने से पहले बस मालिक से संपर्क करें।" : "Contact the bus owner before cancelling."}</p>
        {bookings.length === 0 ? <p className="text-sm text-gray-500">{hindi ? "अभी कोई बुकिंग नहीं है।" : "No bookings yet."}</p> : bookings.map((booking) => (
          <div key={booking.id} className="border rounded-xl p-4 mb-4 shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{booking.trip.bus.busNumber} — {booking.trip.route.source} → {booking.trip.route.destination}</p>
                <p className="text-sm text-gray-500">{new Date(booking.trip.departureTime).toLocaleString()} → {new Date(booking.trip.arrivalTime).toLocaleString()}</p>
              </div>
              <span className="text-sm font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">{booking.status}</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1 mt-2">
              {booking.trip.bus.pickupLocation && <p><span className="font-medium">Pickup:</span> {booking.trip.bus.pickupLocation}</p>}
              {booking.trip.bus.dropLocation && <p><span className="font-medium">Drop:</span> {booking.trip.bus.dropLocation}</p>}
              {booking.trip.route.pickupPoint && !booking.trip.bus.pickupLocation && <p><span className="font-medium">Pickup:</span> {booking.trip.route.pickupPoint}</p>}
              {booking.trip.route.dropPoint && !booking.trip.bus.dropLocation && <p><span className="font-medium">Drop:</span> {booking.trip.route.dropPoint}</p>}
              {booking.trip.bus.ownerPhone && <p><span className="font-medium">Bus Owner Phone:</span> {booking.trip.bus.ownerPhone}</p>}
            </div>
            {booking.status === "CONFIRMED" && <a href={`/support?bookingId=${booking.id}`} className="text-sm text-brand-700 font-medium">{hindi ? "रद्द करने का अनुरोध" : "Request cancellation"}</a>}
          </div>
        ))}
        <div className="border-t pt-4 text-xs text-amber-800 bg-amber-50 p-3 rounded">
          <p><strong>{hindi ? "रद्दीकरण सूचना:" : "Cancellation disclaimer:"}</strong> {hindi ? "रद्द करने से पहले बस मालिक से बात करें। प्रस्थान के 24 घंटे के अंदर रद्द करने पर एडमिन की मंज़ूरी के बाद केवल 50% रिफंड मिलेगा।" : "Please speak with the bus owner before cancelling. A cancellation within 24 hours of departure receives only a 50% refund after admin approval."}</p>
        </div>
      </section>
      <form onSubmit={submitComplaint} className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">{hindi ? "शिकायत भेजें" : "Send a complaint"}</h2>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full border rounded-lg px-3 py-2">
          <option value="BUS">Bus</option><option value="SERVICE">Service</option><option value="DRIVER">Driver</option><option value="PAYMENT">Payment</option><option value="OTHER">Other</option>
        </select>
        <input value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder={hindi ? "बुकिंग ID (वैकल्पिक)" : "Booking ID (optional)"} className="w-full border rounded-lg px-3 py-2" />
        <textarea required minLength={10} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={hindi ? "अपनी शिकायत लिखें" : "Describe your complaint"} className="w-full border rounded-lg px-3 py-2" rows={5} />
        <button className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2">{hindi ? "शिकायत भेजें" : "Send complaint"}</button>
      </form>
      <form onSubmit={requestRefund} className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">{hindi ? "रद्दीकरण और रिफंड अनुरोध" : "Request cancellation and refund"}</h2>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
          <p><strong>{hindi ? "रद्दीकरण नीति:" : "Cancellation policy:"}</strong> {hindi ? "रद्द करने से पहले बस मालिक से बात करें। प्रस्थान के 24 घंटे के अंदर रद्द करने पर एडमिन की मंज़ूरी के बाद केवल 50% रिफंड मिलेगा। प्रस्थान के बाद रद्दीकरण की अनुमति नहीं है।" : "Please speak with the bus owner before cancelling. A cancellation within 24 hours of departure receives only a 50% refund after admin approval. Cancellation after departure is not allowed."}</p>
          <p className="text-xs">{hindi ? "रिफंड केवल आपके दिए गए UPI ID पर भेजा जाएगा। अंतिम मंज़ूरी एडमिन की होगी।" : "Refunds are sent only to the UPI ID you provide. Final approval is subject to admin review."}</p>
        </div>
        <input required value={refundBookingId} onChange={(event) => setRefundBookingId(event.target.value)} placeholder={hindi ? "बुकिंग ID" : "Booking ID"} className="w-full border rounded-lg px-3 py-2" />
        <input required value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder={hindi ? "रिफंड के लिए UPI ID" : "UPI ID for refund"} className="w-full border rounded-lg px-3 py-2" />
        <p className="text-xs text-gray-500">{hindi ? "रिफंड का अनुरोध करते समय UPI ID आवश्यक है।" : "Your UPI ID is required only when you request a refund."}</p>
        <button className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2">{hindi ? "रद्दीकरण अनुरोध भेजें" : "Request cancellation"}</button>
      </form>
      {notice && <p className="text-sm text-gray-700">{notice}</p>}
    </section>
  );
}
