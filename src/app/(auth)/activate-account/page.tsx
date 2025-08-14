import { Activity, ActivitySquareIcon } from "lucide-react";
import React from "react";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activate Page",
};
export default function Page() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
        Verify Your Email ✉️
      </h2>
      <div className="flex flex-col items-center text-center space-y-4">
        <ActivitySquareIcon className="w-12 h-12 text-green-600" />
        <p className="text-sm text-gray-600">
          A verification link has been sent to your email address.
          <br />
          Please check your inbox to activate your account.
        </p>

        <button
          // onClick={handleResend}
          className="mt-4 inline-flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          // disabled={loading}
        >
          Activate Account
        </button>
      </div>
    </div>
  );
}
