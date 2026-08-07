# Monitoring proof

Vaada's production monitor is the public [Production health GitHub Actions workflow](https://github.com/Parthuss/vaada-crm/actions/workflows/uptime.yml). It runs on a five-minute schedule and can also be triggered manually before a demo.

The workflow calls [the public `/health` endpoint](https://vaada-crm.vercel.app/health), retries transient network failures, requires an HTTP success response, parses the JSON body, and fails unless both `status` and `database` equal `ok`. Every run retains its timestamp, deployed version, database status, and measured database latency in the public Actions log.

Deployment verification on 7 August 2026 returned HTTP `200`, `status: ok`, `database: ok`, and version `PENDING_DEPLOY_SHA`. Vercel function logs provide request/error visibility, while the `AIRequest` table records the AI use case, model, outcome (`resultCategory`), duration, and retry count for every request, without storing prompt bodies. Each row's own `id` is the traceable request identifier — there is no separate request-ID column.
