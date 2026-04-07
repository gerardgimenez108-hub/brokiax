const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

const BASE_URL = process.env.APP_BASE_URL || "https://brokiax.web.app";
const CRON_SECRET = process.env.CRON_SECRET || "";

async function invokeCron(path) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
  };

  if (CRON_SECRET) {
    headers.Authorization = `Bearer ${CRON_SECRET}`;
    headers["X-Cron-Secret"] = CRON_SECRET;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Cron call failed (${response.status}): ${text}`);
  }

  return text;
}

exports.engineTick = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "Etc/UTC",
    region: "us-central1",
    retryCount: 2,
    memory: "256MiB",
  },
  async () => {
    logger.info("[SCHEDULER] Triggering /api/cron/tick", {baseUrl: BASE_URL});
    const result = await invokeCron("/api/cron/tick");
    logger.info("[SCHEDULER] /api/cron/tick completed", {result});
  },
);

exports.showcaseTick = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "Etc/UTC",
    region: "us-central1",
    retryCount: 2,
    memory: "256MiB",
  },
  async () => {
    logger.info("[SCHEDULER] Triggering /api/cron/showcase-trader", {baseUrl: BASE_URL});
    const result = await invokeCron("/api/cron/showcase-trader");
    logger.info("[SCHEDULER] /api/cron/showcase-trader completed", {result});
  },
);
