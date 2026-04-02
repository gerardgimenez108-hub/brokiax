"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Send, Copy, Check, RefreshCw, Smartphone } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function TelegramSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramId, setTelegramId] = useState<string>("");
  const [connectCode, setConnectCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadTelegramSettings = async () => {
      try {
        const docRef = doc(db, "users", user.uid, "settings", "telegram");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setTelegramId(docSnap.data().chatId || "");
          if (!docSnap.data().chatId) {
             ensureConnectCode();
          }
        } else {
          ensureConnectCode();
        }
      } catch (err) {
        console.error("Failed to load telegram settings", err);
      } finally {
        setLoading(false);
      }
    };
    
    const ensureConnectCode = async () => {
      // Generate a random 6 digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setConnectCode(code);
      try {
        await setDoc(doc(db, "users", user.uid, "settings", "telegram"), {
          connectCode: code,
          chatId: null
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    };

    loadTelegramSettings();
  }, [user]);

  const copyCode = () => {
    navigator.clipboard.writeText(connectCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unlink = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, "users", user.uid, "settings", "telegram"), {
        connectCode: code,
        chatId: null
      }, { merge: true });
      setTelegramId("");
      setConnectCode(code);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const isFree = user?.subscriptionStatus === "incomplete";

  if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in relative">
      {isFree && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/60 flex items-center justify-center rounded-2xl">
          <div className="glass-card p-8 text-center max-w-md mx-4 shadow-2xl border border-sky-500/20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/20 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-sky-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Alertas Telegram PRO</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Recibe notificaciones en vivo de todas tus operaciones y avisos de riesgo directamente en Telegram.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500 flex items-center gap-2">
          <Send className="w-6 h-6 text-sky-400" />
          Alertas Telegram
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Conecta tu cuenta de Telegram para recibir alertas en tiempo real sobre ejecuciones de trades, stop-losses y validación de riesgos de tus agentes.
        </p>
      </div>

      <div className="glass-card p-6 border border-sky-500/10">
        {telegramId ? (
          <div className="space-y-6 text-center py-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Telegram Conectado Exitosamente</h3>
              <p className="text-[var(--text-secondary)]">
                Chat ID: <span className="font-mono text-white">{telegramId}</span>
              </p>
            </div>
            <div className="pt-4 flex justify-center">
              <button 
                onClick={unlink} 
                disabled={saving}
                className="btn-danger flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Desvincular Cuenta
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center p-8 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-primary)] text-center">
              <Smartphone className="w-12 h-12 text-sky-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Vincula nuestro Bot</h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-sm mb-6">
                Abre un chat con <span className="text-sky-400 font-medium">@Brokiax_Bot</span> en Telegram y envíale el siguiente código de vinculación.
              </p>
              
              <div className="flex items-center gap-2 p-1 bg-[var(--bg-elevated)] border border-[var(--border-secondary)] rounded-lg">
                <div className="px-6 py-3 font-mono text-2xl font-bold tracking-widest text-white">
                  {connectCode || "------"}
                </div>
                <button 
                  onClick={copyCode}
                  className="p-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors text-[var(--text-secondary)] hover:text-white"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-sky-400 mb-2">Instrucciones Rápidas:</h4>
              <ol className="list-decimal pl-5 text-sm text-[var(--text-secondary)] space-y-2">
                <li>Abre Telegram y busca <strong className="text-white">@Brokiax_Bot</strong>.</li>
                <li>Inicia o presiona "Start" en el bot.</li>
                <li>Envía exactamente el mensaje: <code className="bg-[var(--bg-elevated)] px-1 rounded text-sky-300">/connect {connectCode}</code></li>
                <li>Poco después, esta página se actualizará reflejando tu vinculación.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
