"use client";

import { MailCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { Metadata } from "next";

 const metadata: Metadata = {
    title: "Verification Page",
  };

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResent(true);
    }, 2000); // fake API call
  };

 
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
        Verify Your Email ✉️
      </h2>
      <div className="flex flex-col items-center text-center space-y-4">
        <MailCheck className="w-12 h-12 text-green-600" />
        <p className="text-sm text-gray-600">
          A verification link has been sent to your email address.
          <br />
          Please check your inbox to activate your account.
        </p>

        {resent && (
          <div className="text-green-600 text-sm">
            ✅ Verification link resent!
          </div>
        )}

        <button
          onClick={handleResend}
          className="mt-4 inline-flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Resend Email
        </button>
      </div>
    </div>
  );
}
