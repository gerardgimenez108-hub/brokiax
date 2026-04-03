"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, PlusCircle, RefreshCw, Server, Send } from "lucide-react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

interface BurnerWallet {
  address: string;
  privateKey: string; // In a production app, this should be encrypted KMS/Lit
  balance: string;
  maxDailySpend: number;
  isEnabled: boolean;
}

export default function X402Settings() {
  const { user } = useAuth();
  const [burner, setBurner] = useState<BurnerWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(docRef);
        if (userDoc.exists() && userDoc.data().x402Wallet) {
          setBurner(userDoc.data().x402Wallet);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const generateWallet = async () => {
    if (!user) return;
    const pKey = generatePrivateKey();
    const account = privateKeyToAccount(pKey);
    
    const newBurner: BurnerWallet = {
      address: account.address,
      privateKey: pKey,
      balance: "0.00",
      maxDailySpend: 5,
      isEnabled: true,
    };
    
    await updateDoc(doc(db, "users", user.uid), {
      x402Wallet: newBurner
    });
    
    setBurner(newBurner);
  };

  const toggleEnabled = async () => {
    if (!user || !burner) return;
    const newState = !burner.isEnabled;
    setBurner({ ...burner, isEnabled: newState });
    await updateDoc(doc(db, "users", user.uid), {
      "x402Wallet.isEnabled": newState
    });
  };

  if (isLoading) return <div className="p-8 text-zinc-400">Loading x402 settings...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Server className="text-indigo-400 h-6 w-6" />
          Autonomous x402 Payments
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Fund an autonomous burner wallet with USDC (Base network) to pay for AI API calls without needing external provider keys (OpenAI, Anthropic). 
          Brokiax will automatically execute the EIP-712 HTTP 402 flow for you.
        </p>
      </div>

      {!burner ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Create Agent Wallet</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm mx-auto">
            Generate a secure, non-custodial burner wallet dedicated to AI execution fees. Your master keys never interact.
          </p>
          <Button onClick={generateWallet} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Generate Wallet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wallet Address Card */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
              Agent Wallet Address
            </h3>
            
            <div className="flex items-center justify-between bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-primary)] mb-4">
              <code className="text-indigo-400 text-sm">{burner.address}</code>
              <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(burner.address)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">Network</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-white">Base</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Token</p>
                <span className="text-sm font-medium text-white">USDC</span>
              </div>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
              Payment Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-primary)]">
                <div>
                  <p className="font-medium text-white">X402 Payments</p>
                  <p className="text-xs text-[var(--text-secondary)]">Allow agent to spend USDC for LLMs</p>
                </div>
                <button 
                  onClick={toggleEnabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${burner.isEnabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${burner.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="pt-2">
                 <p className="font-medium text-white mb-1">Daily Spend Limit</p>
                 <div className="flex items-center gap-2">
                   <span className="text-2xl font-bold text-white">${burner.maxDailySpend}</span>
                   <span className="text-sm text-[var(--text-secondary)]">USDC</span>
                 </div>
                 <p className="text-xs text-[var(--text-secondary)] mt-2">
                   Limits amount of AI calls the agent can perform autonomously per day.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
