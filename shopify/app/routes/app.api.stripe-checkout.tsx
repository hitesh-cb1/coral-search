import type { HeadersFunction, ActionFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import Stripe from "stripe";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }


  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return Response.json(
      {
        error: "Stripe is not configured",
        message: "STRIPE_SECRET_KEY environment variable is not set. Please configure Stripe credentials.",
      },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-01-28.clover",
  });

  try {
    const body = await request.json();
    const { amount, currency = "inr", credits } = body;

    if (!amount || amount <= 0) {
      return Response.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }


    const appUrl = process.env.SHOPIFY_APP_URL || "";
    const shopDomain = session.shop;
    
   
    const shopName = shopDomain.replace('.myshopify.com', '');
    
    const appClientId = process.env.SHOPIFY_API_KEY || "8ff0ff66e98017c274ba21c8f8a1f195";
    
    // Format: https://admin.shopify.com/store/{shop}/apps/{client_id}/app/billing
    const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${appClientId}`;
    const successUrl = `${shopifyAdminUrl}/app/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${shopifyAdminUrl}/app/billing?canceled=true`;

    const productId = process.env.STRIPE_PRODUCT_ID;
    
    const lineItems = [
      {
        price_data: {
          currency: currency.toLowerCase(),
         
          ...(productId 
            ? { product: productId }
            : {
                product_data: {
                  name: "Credit Top-up",
                  description: `Add ${credits?.toLocaleString() || 0} search credits to your account`,
                },
              }
          ),
          unit_amount: Math.round(amount * 100), 
        },
        quantity: 1,
      },
    ];

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        shop: shopDomain,
        credits: credits?.toString() || "0",
      },
      customer_email: session.email || undefined,
    });

    return Response.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return Response.json(
      {
        error: "Failed to create checkout session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

