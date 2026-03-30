"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { User, PlanTier } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          // Sync with server ensuring document existence and admin privileges
          const token = await user.getIdToken();
          await fetch("/api/user/sync", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          }).catch(console.error);

          // Fetch additional user data from Firestore
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUser(docSnap.data() as User);
          } else {
            // Document might not exist yet if just registered,
            // the register function handles creating it
            setUser({
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "Trader",
              plan: "starter",
              subscriptionStatus: "incomplete",
              createdAt: new Date().toISOString() as any,
              updatedAt: new Date().toISOString() as any,
            });
          }
        } catch (error) {
          console.error("Error fetching user data (posible bloqueo por reglas de Firestore):", error);
          // FALLBACK seguro: bloqueamos el acceso por defecto
          setUser({
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || (user.isAnonymous ? "Invitado" : "Trader"),
            plan: "starter",
            subscriptionStatus: "incomplete",
            createdAt: new Date().toISOString() as any,
            updatedAt: new Date().toISOString() as any,
          });
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
