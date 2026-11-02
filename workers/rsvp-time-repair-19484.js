import { repairRsvpTime19484 } from "../scripts/repair-rsvp-time-19484.mjs";

// Temporary scheduled worker: no HTTP endpoint and no additional credentials.
// It uses only its existing D1 binding and the fixed, guarded repair operation.
const repairWorker = {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const result = await repairRsvpTime19484({
          token: "bound-database-runtime",
          apply: true,
          fetcher: async (url, init) => {
            if (String(url).startsWith("https://api.cloudflare.com/client/v4/accounts/")) {
              const { sql, params } = JSON.parse(init.body);
              const result = await env.GIFT_DB.prepare(sql).bind(...params).all();
              return Response.json({ success: result.success !== false, result: [result] });
            }
            return fetch(url, init);
          },
        });
        console.log(`RSVP_REPAIR_19484=${JSON.stringify(result)}`);
      } catch (error) {
        if (error instanceof Error && error.message === "sync_job_is_not_idle") {
          console.log(`RSVP_REPAIR_19484=${JSON.stringify({ status: "waiting" })}`);
          return;
        }
        console.error(`RSVP_REPAIR_19484=${JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : "repair_failed" })}`);
        throw error;
      }
    })());
  },
};

export default repairWorker;
