import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!db) {
      console.error("❌ Database client is not initialized");
      return Response.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    if (!db.shopBilling) {
      console.error("❌ shopBilling model is not available on database client");
      return Response.json(
        { error: "Database model not available" },
        { status: 500 }
      );
    }

    // Fetch billing data from database
    const shopBilling = await db.shopBilling.findUnique({
      where: { shop },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 transactions
        },
      },
    });

    if (!shopBilling) {
      // Return default values if no billing record exists
      return Response.json({
        shop,
        remainingCredits: 0,
        totalSearches: 0,
        monthlyLimit: 1000,
        creditValue: 0,
        hasLowBalance: true,
        transactions: [],
      });
    }

    // Calculate credit value in currency (₹100 per 1000 credits)
    const creditValue = (shopBilling.remainingCredits / 1000) * 100;

    // Format transactions for response
    const transactions = (shopBilling.transactions || []).map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      credits: transaction.credits,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
    }));

    return Response.json({
      shop,
      remainingCredits: shopBilling.remainingCredits,
      totalSearches: shopBilling.totalSearches,
      monthlyLimit: shopBilling.monthlyLimit,
      creditValue: creditValue,
      hasLowBalance: shopBilling.remainingCredits < 10000,
      transactions,
    });
  } catch (error) {
    console.error("❌ Error fetching credits:", error);
    return Response.json(
      {
        error: "Failed to fetch credits",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

