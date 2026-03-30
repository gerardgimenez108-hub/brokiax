"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Crown, Zap, Building2 } from "lucide-react";

const PLAN_TIERS = ["starter", "pro", "elite", "enterprise"] as const;

export default function BillingPage() {
  const { user, firebaseUser } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const t = useTranslations("billing");

  const currentPlanIndex = PLAN_TIERS.indexOf(
    (user?.plan as typeof PLAN_TIERS[number]) || "starter"
  );

  const handleUpgrade = async (plan: string) => {
    try {
      setLoadingPlan(plan);
      const token = await firebaseUser?.getIdToken();
      if (!token) return;

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Stripe checkout error:", data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoadingPlan("manage");
      const token = await firebaseUser?.getIdToken();
      if (!token) return;

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      key: "starter",
      name: t("free"),
      price: "0",
      icon: Zap,
      features: [t("free_1"), t("free_2"), t("free_3"), t("free_4")],
      badge: null,
    },
    {
      key: "pro",
      name: "Pro",
      price: "29",
      icon: Crown,
      features: [t("pro_1"), t("pro_2"), t("pro_3"), t("pro_4")],
      badge: t("recommended"),
    },
    {
      key: "elite",
      name: "Elite",
      price: "79",
      icon: Crown,
      features: [t("elite_1"), t("elite_2"), t("elite_3"), t("elite_4")],
      badge: null,
    },
    {
      key: "enterprise",
      name: "Enterprise",
      price: "199",
      icon: Building2,
      features: [t("enterprise_1"), t("enterprise_2"), t("enterprise_3"), t("enterprise_4")],
      badge: t("institutional"),
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t("subtitle")}</p>
      </div>

      {/* Current Plan */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">{t("currentPlan")}</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold capitalize">{user?.plan || "Starter"}</span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--brand-500)]/10 text-[var(--brand-400)]">
                {t("currentPlanBadge")}
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {user?.subscriptionStatus === "active" ? t("activeSub") : t("noActiveSub")}
            </p>
          </div>
          {user?.stripeCustomerId && (
            <button
              onClick={handleManageSubscription}
              disabled={loadingPlan === "manage"}
              className="btn-secondary"
            >
              {loadingPlan === "manage" ? t("processing") : t("manageStripe")}
            </button>
          )}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("upgradePlan")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => {
            const isCurrent = i === currentPlanIndex;
            const isDowngrade = i < currentPlanIndex;
            const isEnterprise = plan.key === "enterprise";

            return (
              <div
                key={plan.key}
                className={`glass-card p-6 relative transition-all ${
                  isCurrent ? "border-[var(--brand-500)]/50 shadow-[0_0_20px_rgba(124,58,237,0.08)]" : ""
                } ${plan.badge === t("recommended") ? "border-[var(--brand-500)]/30" : ""}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold ${
                    plan.badge === t("recommended")
                      ? "bg-gradient-to-r from-[var(--brand-600)] to-[var(--accent-500)] text-white"
                      : "bg-gradient-to-r from-amber-600 to-orange-500 text-white"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-500)]/10 flex items-center justify-center">
                    <plan.icon className="w-4 h-4 text-[var(--brand-400)]" />
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold">€{plan.price}</span>
                  <span className="text-[var(--text-tertiary)] text-sm">/mes</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-lg bg-[var(--bg-secondary)] text-center text-sm font-medium text-[var(--text-secondary)] cursor-default">
                    {t("currentPlanBadge")}
                  </div>
                ) : isEnterprise ? (
                  <a
                    href="mailto:enterprise@brokiax.com?subject=Brokiax Enterprise"
                    className="block w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-500 text-white text-center text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    {t("contactSales")}
                  </a>
                ) : isDowngrade ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={loadingPlan !== null}
                    className="btn-secondary w-full py-2.5 text-sm"
                  >
                    {t("manageStripe")}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={loadingPlan !== null}
                    className="btn-primary w-full py-2.5 text-sm"
                  >
                    {loadingPlan === plan.key
                      ? t("processing")
                      : t("upgradeBtn", { plan: plan.name })}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
