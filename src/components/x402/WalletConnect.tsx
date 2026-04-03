"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, CheckCircle2 } from "lucide-react";
import { createWalletClient, custom, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnect() {
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const client = createWalletClient({
            chain: base,
            transport: custom(window.ethereum as any),
          });
          const [addr] = await client.getAddresses();
          if (addr) {
            setAddress(addr);
            const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
            setChainId(parseInt(chainIdHex as string, 16));
          }
        } catch (error) {
          console.error("Failed to check wallet connection:", error);
        }
      }
    };
    checkConnection();

    // Listen to network/account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0] as Address);
        } else {
          setAddress(null);
        }
      });
      window.ethereum.on("chainChanged", (newChainId: string) => {
        setChainId(parseInt(newChainId, 16));
      });
    }
  }, []);

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet.");
      return;
    }
    
    setIsConnecting(true);
    try {
      const client = createWalletClient({
        chain: base,
        transport: custom(window.ethereum as any),
      });
      
      const [addr] = await client.requestAddresses();
      setAddress(addr);
      
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(chainIdHex as string, 16));
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    // Note: User must disconnect physically from MetaMask to fully sever connection
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex items-center gap-3">
      {address ? (
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-sm font-medium text-indigo-400">
            {formatAddress(address)}
          </span>
          {chainId !== 8453 && chainId !== 84532 && (
            <span className="text-xs text-rose-400 font-medium ml-1">
              (Wrong Chain)
            </span>
          )}
          <button 
            onClick={disconnect}
            className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button 
          onClick={connect} 
          disabled={isConnecting}
          variant="outline"
          className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      )}
    </div>
  );
}
