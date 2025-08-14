import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password Page",
};
export default function Page (){
    return(
        <div >
         <h2 className="text-2xl font-bold text-center text-green-700">Reset Password 🔐</h2>
            <form className="space-y-4">
        <div>
          <label>Email</label>
          <input type="email" className="w-full border rounded p-2 mt-1" placeholder="you@example.com" />
        </div>
        <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
          Send Reset Link
        </button>
        <p className="text-sm text-center">
          Remember your password? <Link href="/login" className="text-green-700 hover:underline">Log in</Link>
        </p>
      </form>
        </div>
    )
}