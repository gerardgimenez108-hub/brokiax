"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile,
  signInAnonymously
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");

  const createFirestoreUser = async (uid: string, email: string, displayName: string, photoURL?: string) => {
    try {
      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        displayName,
        photoURL: photoURL || null,
        plan: "starter",
        subscriptionStatus: "incomplete",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (firestoreErr) {
      console.warn("Firestore write error (may lack permissions or doc exists):", firestoreErr);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await createFirestoreUser(user.uid, user.email!, name, user.photoURL || undefined);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      
      const docRef = doc(db, "users", user.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Google User",
            photoURL: user.photoURL || null,
            plan: "starter",
            subscriptionStatus: "incomplete",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (firestoreErr) {
        console.warn("Firestore error on Google Auth:", firestoreErr);
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAnonymousRegister = async () => {
    setLoading(true);
    try {
      const { user } = await signInAnonymously(auth);
      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: "guest@brokiax.local",
          displayName: "Guest",
          photoURL: null,
          plan: "starter",
          subscriptionStatus: "incomplete",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {}
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[var(--brand-700)]/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--accent-500)]/20 rounded-full blur-[100px]" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-md glass-card p-10 z-10 animate-fade-in gradient-border">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg">
            B
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--text-tertiary)]">
            {t("registerTitle")}
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            {t("registerSubtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg badge-danger text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t("displayName")}
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t("password")}
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-6 !py-3 flex justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t("registerBtn")
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border-primary)]" />
          <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider">
            {t("orContinueWith")}
          </span>
          <div className="h-px flex-1 bg-[var(--border-primary)]" />
        </div>

        <button
          onClick={handleGoogleRegister}
          type="button"
          className="w-full btn-secondary mt-6 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {t("googleBtn")}
        </button>

        <button
          onClick={handleAnonymousRegister}
          type="button"
          disabled={loading}
          className="w-full mt-3 p-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t("anonymousBtn")}
        </button>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="text-[var(--brand-400)] font-medium hover:text-[var(--brand-300)] transition-colors"
          >
            {t("loginBtn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
