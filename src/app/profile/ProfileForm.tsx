"use client";

import { useState } from "react";

export default function ProfileForm({ name, phone, address, language, phoneVerified, email, emailVerified }: { name: string; phone: string | null; address: string | null; language: "ENGLISH" | "HINDI"; phoneVerified: boolean; email: string; emailVerified: boolean }) {
  const [nameValue, setNameValue] = useState(name);
  const [emailValue, setEmailValue] = useState(email);
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [addressValue, setAddressValue] = useState(address ?? "");
  const [languageValue, setLanguageValue] = useState(language);
  const [phoneIsVerified, setPhoneIsVerified] = useState(phoneVerified);
  const [emailIsVerified, setEmailIsVerified] = useState(emailVerified);
  const hindi = language === "HINDI";
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    if (phoneValue !== phone && !phoneIsVerified) {
      setMessage(hindi ? "सेव करने से पहले नए फोन नंबर का OTP सत्यापित करें।" : "Verify the new phone number with OTP before saving.");
      return;
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameValue, phone: phoneValue, address: addressValue, language: languageValue }),
    });

    const data = await response.json().catch(() => ({ error: "Could not update profile. Please try again." }));
    setMessage(response.ok ? (hindi ? "प्रोफ़ाइल अपडेट हो गई।" : "Profile updated.") : data.error || (hindi ? "प्रोफ़ाइल अपडेट नहीं हो सकी।" : "Could not update profile."));
    setSaving(false);
  }

  async function sendOtp() {
    const response = await fetch("/api/profile/phone/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phoneValue }) });
    const data = await response.json().catch(() => ({ error: "Could not send phone verification code. Please try again." }));
    setMessage(response.ok ? (hindi ? "फोन पर सत्यापन कोड भेज दिया गया है।" : "Phone verification code sent.") : data.error);
    if (response.ok) {
      setPhoneValue(data.phone || phoneValue);
      setCode("");
      setOtpSent(true);
    }
  }

  async function verifyPhone() {
    const response = await fetch("/api/profile/phone/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phoneValue, code }) });
    const data = await response.json().catch(() => ({ error: "Could not verify phone number. Please try again." }));
    setMessage(response.ok ? (hindi ? "फोन नंबर सत्यापित हो गया।" : "Phone number verified.") : data.error);
    if (response.ok) {
      setPhoneValue(data.phone || phoneValue);
      setOtpSent(false);
      setPhoneIsVerified(true);
    }
  }

  async function sendEmailOtp() {
    const response = await fetch("/api/profile/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailValue }) });
    const data = await response.json().catch(() => ({ error: "Could not send email verification code. Please try again." }));
    setMessage(response.ok ? (hindi ? "ईमेल पर सत्यापन कोड भेज दिया गया है।" : "Email verification code sent.") : data.error);
    if (response.ok) {
      setEmailCode("");
      setEmailOtpSent(true);
    }
  }

  async function verifyEmail() {
    const response = await fetch("/api/profile/email/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: emailCode }) });
    const data = await response.json().catch(() => ({ error: "Could not verify email address. Please try again." }));
    setMessage(response.ok ? (hindi ? "ईमेल सत्यापित हो गया।" : "Email verified.") : data.error);
    if (response.ok) {
      setEmailOtpSent(false);
      setEmailIsVerified(true);
      setEmailValue(data.email || emailValue);
    }
  }

  return (
    <form onSubmit={saveProfile} className="space-y-7">
      <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{hindi ? "प्राथमिकताएं" : "Preferences"}</h3>
        <label htmlFor="language" className="block text-sm text-gray-500 mb-1">{hindi ? "भाषा" : "Language"}</label>
        <select id="language" value={languageValue} onChange={(event) => setLanguageValue(event.target.value as "ENGLISH" | "HINDI")} className="w-full border rounded-lg px-3 py-2">
          <option value="ENGLISH">English</option>
          <option value="HINDI">हिन्दी</option>
        </select>
      </div>
      <div>
        <h3 className="mb-3 border-t pt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">{hindi ? "व्यक्तिगत जानकारी" : "Personal information"}</h3>
        <label htmlFor="name" className="block text-sm text-gray-500 mb-1">{hindi ? "नाम" : "Name"} <span className="text-red-600">*</span></label>
        <input id="name" required value={nameValue} onChange={(event) => setNameValue(event.target.value)} className="w-full border rounded-lg px-3 py-2" />
      </div>
      <div>
        <h3 className="mb-3 border-t pt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">{hindi ? "सत्यापन" : "Verification"}</h3>
        <label htmlFor="email" className="block text-sm text-gray-500 mb-1">Gmail <span className="text-red-600">*</span></label>
        <input id="email" type="email" required value={emailValue} onChange={(event) => setEmailValue(event.target.value)} className="w-full border rounded-lg px-3 py-2" />
        <p className="text-xs text-gray-500">{hindi ? "स्थिति:" : "Status:"} {emailIsVerified && emailValue.toLowerCase() === email.toLowerCase() ? (hindi ? "सत्यापित" : "Verified") : (hindi ? "सत्यापित नहीं" : "Not verified")}</p>
        {(!emailIsVerified || emailValue.toLowerCase() !== email.toLowerCase()) && <button type="button" onClick={sendEmailOtp} className="text-sm text-brand-700 font-medium mt-2">{hindi ? "ईमेल सत्यापन कोड भेजें" : "Send email verification code"}</button>}
        {emailOtpSent && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <label htmlFor="email-otp" className="block text-sm font-medium text-gray-700 mb-2">{hindi ? "नए ईमेल पर भेजा गया 6 अंकों का OTP दर्ज करें" : "Enter the 6-digit OTP sent to the new email"}</label>
            <div className="flex flex-col gap-2 sm:flex-row"><input id="email-otp" inputMode="numeric" maxLength={6} value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" className="border rounded-lg px-3 py-2" /><button type="button" onClick={verifyEmail} disabled={emailCode.length !== 6} className="bg-brand-600 text-white rounded-lg px-3 py-2 disabled:opacity-50">{hindi ? "ईमेल सत्यापित करें" : "Verify email"}</button></div>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm text-gray-500 mb-1">{hindi ? "फोन नंबर" : "Phone number"} <span className="text-red-600">*</span></label>
        <input id="phone" type="tel" required value={phoneValue} onChange={(event) => { setPhoneValue(event.target.value); setPhoneIsVerified(event.target.value === phone ? phoneVerified : false); }} className="w-full border rounded-lg px-3 py-2" placeholder="Enter phone with country code" />
        <p className="text-xs text-gray-500">{hindi ? "स्थिति:" : "Status:"} {phoneIsVerified && phoneValue === phone ? (hindi ? "सत्यापित" : "Verified") : (hindi ? "सत्यापित नहीं" : "Not verified")}</p>
        {(!phoneIsVerified || phoneValue !== phone) && <button type="button" onClick={sendOtp} className="text-sm text-brand-700 font-medium">{hindi ? "फोन सत्यापन कोड भेजें" : "Send phone verification code"}</button>}
        {otpSent && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <label htmlFor="phone-otp" className="block text-sm font-medium text-gray-700 mb-2">
              {hindi ? "फोन पर भेजा गया 6 अंकों का सत्यापन कोड दर्ज करें" : "Enter the 6-digit verification code sent to your phone"}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="phone-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="border rounded-lg px-3 py-2 tracking-[0.3em]"
              />
              <button type="button" onClick={verifyPhone} disabled={code.length !== 6} className="bg-brand-600 text-white rounded-lg px-3 py-2 disabled:opacity-50">{hindi ? "फोन सत्यापित करें" : "Verify phone"}</button>
            </div>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="address" className="block text-sm text-gray-500 mb-1">{hindi ? "पता (वैकल्पिक)" : "Address (optional)"}</label>
        <textarea id="address" value={addressValue} onChange={(event) => setAddressValue(event.target.value)} className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Enter your address" />
      </div>
      <button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg px-4 py-2">
        {saving ? (hindi ? "सेव हो रहा है..." : "Saving...") : (hindi ? "प्रोफ़ाइल सेव करें" : "Save profile")}
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}