import type { ActionFunctionArgs } from "react-router";
import Stripe from "stripe";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🔔 Stripe webhook received:", request.method, request.url);
  
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !stripeWebhookSecret) {
    console.error("❌ Stripe configuration missing - STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set");
    return new Response("Stripe not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-01-28.clover",
  });

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`, {
      status: 400,
    });
  }

  console.log("📦 Webhook event type:", event.type);

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("💳 Payment session:", session.id, "Status:", session.payment_status);
    console.log("📋 Session metadata:", session.metadata);

    if (session.payment_status === "paid" && session.metadata) {
      const shop = session.metadata.shop;
      const credits = parseInt(session.metadata.credits || "0");
      const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents/paisa

      if (!shop || credits <= 0) {
        console.error("Invalid session metadata:", session.metadata);
        return new Response("Invalid session data", { status: 400 });
      }

      try {
        // Get or create billing record
        let shopBilling = await (db as any).shopBilling.findUnique({
          where: { shop },
        });

        if (!shopBilling) {
          shopBilling = await (db as any).shopBilling.create({
            data: {
              shop,
              remainingCredits: 0,
              totalSearches: 0,
              monthlyLimit: 1000,
            },
          });
        }

        // Check if transaction already exists (idempotency)
        const existingTransaction = await (db as any).billingTransaction.findFirst({
          where: {
            shopBillingId: shopBilling.id,
            stripeSessionId: session.id,
          },
        });

        if (!existingTransaction) {
          // Update credits
          await (db as any).shopBilling.update({
            where: { id: shopBilling.id },
            data: {
              remainingCredits: {
                increment: credits,
              },
            },
          });

          // Create transaction record
          await (db as any).billingTransaction.create({
            data: {
              shopBillingId: shopBilling.id,
              type: "Top-up",
              amount: amount,
              credits: credits,
              status: "Paid",
              stripeSessionId: session.id,
              description: `Credit top-up of ${credits.toLocaleString()} credits`,
            },
          });

          console.log(`✅ Credits updated for ${shop}: +${credits} credits (Total: ${shopBilling.remainingCredits + credits})`);
        } else {
          console.log(`ℹ️ Transaction already processed for session ${session.id}`);
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        return new Response("Error processing payment", { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

