import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, useRevalidator } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useState, useEffect } from "react";
import db from "../db.server";
import Stripe from "stripe";
import styles from "../styles/app.billing.styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  if (!db) {
    console.error("❌ Database client is not initialized");
    throw new Error("Database connection failed");
  }

  if (!db.shopBilling) {
    console.error("❌ shopBilling model is not available on database client");
    console.error("Available models:", Object.keys(db).filter(key => !key.startsWith('_') && !key.startsWith('$')));
    throw new Error("Database model not available. Please restart the development server.");
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const success = url.searchParams.get("success");
  const reset = url.searchParams.get("reset");

  if (reset === "true") {
    console.log(`🔄 Resetting all billing values for shop ${shop}`);
    try {
     
      const existingBilling = await db.shopBilling.findUnique({
        where: { shop },
      });

      if (existingBilling) {
       
        await db.billingTransaction.deleteMany({
          where: { shopBillingId: existingBilling.id },
        });

       
        await db.shopBilling.update({
          where: { shop },
          data: {
            remainingCredits: 0,
            totalSearches: 0,
            monthlyLimit: 1000,
          },
        });

        console.log(`✅ All billing values reset for shop ${shop}`);
      } else {
        
        await db.shopBilling.create({
          data: {
            shop,
            remainingCredits: 0,
            totalSearches: 0,
            monthlyLimit: 1000,
          },
        });
        console.log(`✅ Created new billing record with reset values for shop ${shop}`);
      }

     
      url.searchParams.delete("reset");
      throw new Response(null, {
        status: 302,
        headers: { Location: url.pathname + (url.search || "") },
      });
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      console.error("❌ Error resetting billing values:", error);
    }
  }

  
  let shopBilling: any = null;

  if (success === "true" && sessionId && sessionId !== "{CHECKOUT_SESSION_ID}") {
    console.log(`💳 Processing payment for shop ${shop}, session: ${sessionId}`);
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2026-01-28.clover",
        });

        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        console.log(`📋 Stripe session retrieved:`, {
          id: checkoutSession.id,
          payment_status: checkoutSession.payment_status,
          metadata: checkoutSession.metadata,
          amount_total: checkoutSession.amount_total,
        });
        
        if (checkoutSession.payment_status === "paid" && checkoutSession.metadata) {
          const credits = parseInt(checkoutSession.metadata.credits || "0");
          const amount = checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0;

          console.log(`💰 Payment details:`, { credits, amount, shop });

          if (credits > 0) {
            
            shopBilling = await db.shopBilling.findUnique({
              where: { shop },
            });

            if (!shopBilling) {
              console.log(`📝 Creating new billing record for ${shop}`);
              shopBilling = await db.shopBilling.create({
                data: {
                  shop,
                  remainingCredits: 0,
                  totalSearches: 0,
                  monthlyLimit: 1000,
                },
              });
            }

            
            const existingTransaction = await db.billingTransaction.findFirst({
              where: {
                shopBillingId: shopBilling.id,
                stripeSessionId: sessionId,
              },
            });

            if (existingTransaction) {
              console.log(`ℹ️ Transaction already exists for session ${sessionId}`);
            } else {
              console.log(`💾 Creating new transaction for ${shop}: ${credits} credits, ₹${amount}`);
              
            
              await db.shopBilling.update({
                where: { id: shopBilling.id },
                data: {
                  remainingCredits: {
                    increment: credits,
                  },
                },
              });

           
              const newTransaction = await db.billingTransaction.create({
                data: {
                  shopBillingId: shopBilling.id,
                  type: "Top-up",
                  amount: amount,
                  credits: credits,
                  status: "Paid",
                  stripeSessionId: sessionId,
                  description: `Credit top-up of ${credits.toLocaleString()} credits`,
                },
              });

              console.log(`✅ Payment processed successfully for ${shop}: +${credits} credits. Transaction ID: ${newTransaction.id}`);
              
            
              shopBilling = await db.shopBilling.findUnique({
                where: { shop },
                include: {
                  transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 50,
                  },
                },
              });
            }
          } else {
            console.warn(`⚠️ Invalid credits value: ${credits}`);
          }
        } else {
          console.warn(`⚠️ Payment not completed or missing metadata. Status: ${checkoutSession.payment_status}`);
        }
      } catch (error) {
        console.error("❌ Error processing payment in loader:", error);
        
      }
    } else {
      console.error("❌ STRIPE_SECRET_KEY not configured");
    }
  } else if (success === "true") {
    console.warn(`⚠️ Missing or invalid session_id. Got: ${sessionId}`);
  }

  if (!shopBilling) {
    shopBilling = await db.shopBilling.findUnique({
      where: { shop },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50, 
        },
      },
    });

    if (!shopBilling) {
      console.log(`📝 Creating new billing record for ${shop} (no payment processing)`);
      shopBilling = await db.shopBilling.create({
        data: {
          shop,
          remainingCredits: 0,
          totalSearches: 0,
          monthlyLimit: 1000,
        },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      });
    } else {
      console.log(`📋 Fetched existing billing record for ${shop} with ${shopBilling.transactions?.length || 0} transactions`);
    }
  }

  const creditValue = (shopBilling.remainingCredits / 1000) * 100;


  const billingHistory = (shopBilling.transactions || []).map((transaction: { createdAt: Date; type: string; amount: number; credits: number; status: string }) => {
    const date = new Date(transaction.createdAt);
    const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    
    return {
      date: dateStr,
      type: transaction.type,
      amount: `₹${transaction.amount.toLocaleString()}`,
      credits: transaction.credits > 0 
        ? `+${transaction.credits.toLocaleString()}` 
        : `${transaction.credits.toLocaleString()}`,
      status: transaction.status,
    };
  });

  console.log(`📊 Final billing data for ${shop}:`, {
    shop: shop,
    remainingCredits: shopBilling.remainingCredits,
    totalTransactions: shopBilling.transactions?.length || 0,
    transactionIds: shopBilling.transactions?.map((t: any) => t.id) || [],
    transactions: shopBilling.transactions?.map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      credits: t.credits,
      status: t.status,
      createdAt: t.createdAt,
    })) || [],
  });

  return {
    plan: {
      name: "Pay-as-you-go",
      price: "₹100 / 1,000 searches",
      billingCycle: "Monthly",
      status: "Active",
    },
    usage: {
      totalSearches: shopBilling.totalSearches,
      remainingCredits: shopBilling.remainingCredits,
      monthlyLimit: shopBilling.monthlyLimit,
      creditValue: creditValue,
    },
    billingHistory,
    showLowBalanceWarning: shopBilling.remainingCredits < 10000,
  };
};

export default function BillingPage() {
  const { plan, usage, billingHistory, showLowBalanceWarning } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidator = useRevalidator();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const sessionId = searchParams.get("session_id");

    if (success === "true" && sessionId) {
      setSuccessMessage("Payment successful! Your credits have been added.");
      
      setSearchParams({}, { replace: true });
      
      
      setTimeout(() => {
        revalidator.revalidate();
      }, 2000); 
    } else if (canceled === "true") {
      setError("Payment was canceled.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, revalidator]);

  const handleTopUp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      
      const amount = 100; 
      const credits = (amount / 100) * 1000; 

      const response = await fetch("/app/api/stripe-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "inr",
          credits,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const data = await response.json();
      
      
      if (data.url) {
        
        if (window.top && window.top !== window) {
          try {
           
            window.top.location.href = data.url;
          } catch (e) {
            
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = data.url;
            form.target = '_top';
            form.style.display = 'none';
            document.body.appendChild(form);
            form.submit();
          }
        } else {
          
          window.location.href = data.url;
        }
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <s-page>
      <div className={styles.container}>
        <s-box padding="base" borderRadius="base">
          <s-box>
            <s-grid gap="base">
              
              {successMessage && (
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: "#d1fae5",
                  color: "#065f46",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}>
                  {successMessage}
                </div>
              )}
              {error && (
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}>
                  {error}
                </div>
              )}

              <div className={styles.header}>
                <div>
                  <s-heading>
                    <span style={{ 
                      fontSize: '25px', 
                      lineHeight: '36px', 
                      fontWeight: 600, 
                      color: 'rgba(31, 33, 36, 0.9)' 
                    }}>
                      Billing & Usage
                    </span>
                  </s-heading>
                  <s-text color="subdued">Track your usage, balance, and payments</s-text>
                </div>
                <s-button 
                  variant="primary" 
                  onClick={handleTopUp}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Top Up Credits"}
                </s-button>
              </div>

            
              <div className={styles.planCard}>
                <s-box padding="large">
                  <div className={styles.planContent}>
                    <div className={styles.planDetails}>
                      <div className={styles.planRow}>
                        <span className={styles.planLabel}>Plan:</span>
                        <span className={styles.planValue}>{plan.name}</span>
                      </div>
                      <div className={styles.planRow}>
                        <span className={styles.planLabel}>Price:</span>
                        <span className={styles.planValue}>{plan.price}</span>
                      </div>
                      <div className={styles.planRow}>
                        <span className={styles.planLabel}>Billing Cycle:</span>
                        <span className={styles.planValue}>{plan.billingCycle}</span>
                      </div>
                    </div>
                    <div className={styles.statusBadge}>
                      <span className={styles.statusDot}></span>
                      {plan.status}
                    </div>
                  </div>
                </s-box>
              </div>

              
              <div className={styles.usageSection}>
                <div className={styles.sectionHeading}>
                  <s-heading>
                    <span style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(31, 33, 36, 0.9)' }}>
                      Usage Overview
                    </span>
                  </s-heading>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
                  {/* Total Searches Card */}
                  <div className={styles.usageCard}>
                    <s-box padding="large">
                      <div className={styles.usageCardContent}>
                        <div className={styles.usageCardTitle}>
                          <s-text>Total Searches</s-text>
                        </div>
                        <div className={styles.usageCardValue}>
                          {usage.totalSearches.toLocaleString()}
                        </div>
                        <div className={styles.usageCardSubtext}>
                          <s-text>
                            {usage.totalSearches.toLocaleString()} / {usage.monthlyLimit.toLocaleString()} searches used
                          </s-text>
                        </div>
                      </div>
                    </s-box>
                  </div>

                  <div className={styles.usageCard}>
                    <s-box padding="large">
                      <div className={styles.usageCardContent}>
                        <div className={styles.usageCardTitle}>
                          <s-text>Remaining Credits</s-text>
                        </div>
                        <div className={styles.usageCardValue}>
                          {usage.remainingCredits.toLocaleString()}
                        </div>
                        <div className={styles.usageCardSubtext}>
                          <s-text>
                            ≈ ₹ {usage.creditValue.toFixed(2)}
                          </s-text>
                        </div>
                      </div>
                    </s-box>
                  </div>

                  <div className={styles.usageCard}>
                    <s-box padding="large">
                      <div className={styles.usageCardContent}>
                        <div className={styles.usageCardTitle}>
                          <s-text>Monthly Limit</s-text>
                        </div>
                        <div className={styles.usageCardValue}>
                          {usage.monthlyLimit.toLocaleString()}
                        </div>
                        <div className={styles.usageCardSubtext}>
                          <s-text>searches</s-text>
                        </div>
                      </div>
                    </s-box>
                  </div>
                </s-grid>
                </div>
              </div>

              {showLowBalanceWarning && (
                <div className={styles.warningBanner}>
                  <div className={styles.warningContent}>
                    <div className={styles.warningIcon}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 2L2 18h16L10 2zm0 3.5L15.5 16H4.5L10 5.5zM9 12v2h2v-2H9zm0-4v3h2V8H9z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <div className={styles.warningText}>
                      Low balance. You are running low on credits. Top up to avoid service interruption.
                    </div>
                    <s-button variant="primary" onClick={handleTopUp}>
                      Top Up Now
                    </s-button>
                  </div>
                </div>
              )}

              {/* Billing History */}
              <div className={styles.billingHistorySection}>
                <s-heading>
                  <span style={{ 
                    fontSize: '25px', 
                    lineHeight: '36px', 
                    fontWeight: 600, 
                    color: 'rgba(31, 33, 36, 0.9)' 
                  }}>
                    Billing History
                  </span>
                </s-heading>
                {billingHistory && billingHistory.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.billingTable}>
                      <thead>
                        <tr>
                          <th className={styles.tableHeader}>Date</th>
                          <th className={styles.tableHeader}>Type</th>
                          <th className={styles.tableHeader}>Amount</th>
                          <th className={styles.tableHeader}>Credits</th>
                          <th className={styles.tableHeader}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.map((item: { date: string; type: string; amount: string; credits: string; status: string }, index: number) => (
                          <tr key={index} className={styles.tableRow}>
                            <td className={styles.tableCell}>{item.date}</td>
                            <td className={styles.tableCell}>{item.type}</td>
                            <td className={styles.tableCell}>{item.amount}</td>
                            <td className={styles.tableCell}>{item.credits}</td>
                            <td className={styles.tableCell}>
                              <span
                                className={`${styles.statusPill} ${
                                  item.status === "Paid"
                                    ? styles.statusPillSuccess
                                    : styles.statusPillNeutral
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#6d7175",
                    fontSize: "14px",
                  }}>
                    No billing history yet. Your transactions will appear here after you make a payment.
                  </div>
                )}
              </div>
            </s-grid>
          </s-box>
        </s-box>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

