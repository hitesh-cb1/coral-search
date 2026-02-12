import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLoaderData } from "react-router";
import styles from "../styles/app._index.styles.module.css";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return { shopDomain: session.shop };
};

export default function AnalyticsPage() {
  const { shopDomain } = useLoaderData<typeof loader>();
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d">("30d");
  const [searchesMetric, setSearchesMetric] = useState<"total" | "unique">(
    "total",
  );

  const dateRange = useMemo(() => {
    switch (timeFilter) {
      case "7d":
        return "Last 7 days";
      case "30d":
        return "Last 30 days";
      case "90d":
        return "Last 90 days";
      default:
        return "Last 30 days";
    }
  }, [timeFilter]);

  const openShopifyAnalytics = () => {
    window.open("https://admin.shopify.com/analytics", "_blank", "noopener,noreferrer");
  };

  const Tooltip = ({
    label,
    content,
    className,
  }: {
    label: ReactNode;
    content: string;
    className?: string;
  }) => (
    <span className={styles.tooltipWrap}>
      <span
        className={`${styles.tooltipTrigger}${className ? ` ${className}` : ""}`}
      >
        {label}
      </span>
      <span className={styles.tooltipContent} role="tooltip">
        {content}
      </span>
    </span>
  );

  const MetricDelta = ({
    direction,
    value,
  }: {
    direction: "up" | "down";
    value: string;
  }) => (
    <span
      className={`${styles.deltaBadge} ${
        direction === "up" ? styles.deltaUp : styles.deltaDown
      }`}
    >
      {direction === "up" ? "▲" : "▼"} {value}
    </span>
  );

  const MetricCard = ({
    title,
    tooltip,
    value,
    delta,
  }: {
    title: ReactNode;
    tooltip: string;
    value: string;
    delta: { direction: "up" | "down"; value: string };
  }) => (
    <div className={styles.card}>
      <s-box padding="large">
        <s-box>
          <Tooltip label={title} content={tooltip} className={styles.cardTitle} />
          <div className={styles.metricRow}>
            <span className={styles.metricNumber}>{value}</span>
            <MetricDelta direction={delta.direction} value={delta.value} />
          </div>
        </s-box>
      </s-box>
    </div>
  );

  const ListCard = ({
    title,
    tooltip,
    rows,
  }: {
    title: string;
    tooltip: string;
    rows: Array<{ label: string; value: string }>;
  }) => (
    <div className={styles.card}>
      <s-box padding="large">
        <s-grid gap="small-200">
          <Tooltip
            label={title}
            content={tooltip}
            className={`${styles.cardTitle} ${styles.underline}`}
          />
          <div className={styles.list}>
            {rows.map((r) => (
              <div key={r.label} className={styles.listRow}>
                <span className={styles.listLabel}>{r.label}</span>
                <span className={styles.listValue}>{r.value}</span>
              </div>
            ))}
          </div>
        </s-grid>
      </s-box>
    </div>
  );

  const searchTop = [
    { label: "succulent", value: "14 searches" },
    { label: "pots", value: "15 searches" },
    { label: "plants", value: "15 searches" },
  ];
  const searchNoResults = [
    { label: "bird food", value: "35 searches" },
    { label: "planters", value: "15 searches" },
    { label: "herbicide", value: "21 searches" },
  ];
  const searchLowClicks = [
    { label: "shovel", value: "13 clicks" },
    { label: "fountain", value: "36 clicks" },
    { label: "bucket", value: "2 clicks" },
  ];

  const searchesValue = useMemo(() => {
    return searchesMetric === "unique" ? "1,023" : "1,427";
  }, [searchesMetric]);

  return (
    <s-page heading="Analytics">
      <div className={styles.container}>
        <s-box padding="base" borderRadius="base">
          <s-box>
            <s-grid gap="small-200">
              <div className={styles.headerRowStart}>
                <s-heading>Search performance</s-heading>
                <s-text color="subdued">{dateRange}</s-text>
              </div>

              <s-grid gridTemplateColumns="repeat(2, 1fr)" gap="base">
                <MetricCard
                  title="Click rate"
                  tooltip="Online store sessions with searches and a clicked result relative to all sessions with searches."
                  value="1.77%"
                  delta={{ direction: "up", value: "32%" }}
                />
                <MetricCard
                  title="Purchase rate"
                  tooltip="Online store sessions with searches and a completed purchase relative to all sessions with searches."
                  value="0.81%"
                  delta={{ direction: "up", value: "82%" }}
                />
              </s-grid>

              <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
                <div
                  role="link"
                  tabIndex={0}
                  aria-label="Open Shopify Analytics: Top online store searches"
                  onClick={openShopifyAnalytics}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openShopifyAnalytics();
                    }
                  }}
                >
                  <ListCard
                    title="Top online store searches"
                    tooltip="Most common search queries in your online store."
                    rows={searchTop}
                  />
                </div>
                <ListCard
                  title="Top online store searches with no results"
                  tooltip="Searches that returned no results."
                  rows={searchNoResults}
                />
                <ListCard
                  title="Top online store searches with low clicks"
                  tooltip="Searches where shoppers clicked results less often."
                  rows={searchLowClicks}
                />
              </s-grid>

              <div className={styles.sectionSpacer} />
              <div className={styles.headerRowStart}>
                <s-heading>Performance metrics</s-heading>
                <s-text color="subdued">{dateRange}</s-text>
              </div>

              <s-grid gridTemplateColumns="repeat(2, 1fr)" gap="base" alignItems="end">
                <MetricCard
                  title={
                    <span className={styles.inlineTitle}>
                      <span>Time filter</span>
                      <select
                        className={styles.inlineSelect}
                        value={timeFilter}
                        onChange={(e) =>
                          setTimeFilter(e.target.value as "7d" | "30d" | "90d")
                        }
                        aria-label="Time filter"
                      >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                      </select>
                    </span>
                  }
                  tooltip="Select the date range for recommendation metrics."
                  value="30%"
                  delta={{ direction: "up", value: "75%" }}
                />
                <MetricCard
                  title={
                    <span className={styles.inlineTitle}>
                      <span>Searches</span>
                      <select
                        className={styles.inlineSelect}
                        value={searchesMetric}
                        onChange={(e) =>
                          setSearchesMetric(e.target.value as "total" | "unique")
                        }
                        aria-label="Searches metric"
                      >
                        <option value="total">Total</option>
                        <option value="unique">Unique</option>
                      </select>
                    </span>
                  }
                  tooltip="Choose whether to show total or unique searches (demo values for now)."
                  value={searchesValue}
                  delta={{ direction: "up", value: "8%" }}
                />
              </s-grid>

              <div className={styles.footer}>
                <s-text color="subdued">Learn more about </s-text>
                <s-link href="#" target="_blank">
                  Search &amp; Discovery
                </s-link>
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

