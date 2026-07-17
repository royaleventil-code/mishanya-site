<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mishanya Site Workflow

Read `Workflow сайт Мишаня.md` before working on the site.

When Sergey says to continue working on the site, do only the startup action unless he gives a concrete task: open the local site at `http://localhost:3003/`. This project must use port `3003` so it does not collide with the CRM work on port `3000`. Do not search for where the work ended, do not infer the next task, do not mark anything as ready, and do not change files without a direct instruction.

Sergey controls the site workflow. After every significant change, complete the mandatory local verification from `Workflow сайт Мишаня.md`: relevant tests, lint, production build, the changed user flow on `http://localhost:3003/`, and browser console/network error checks. Do not call the work ready and do not give Sergey the final completion response until the full verification passes without errors. Push only after Sergey's explicit command.

For this project, Sergey's commands `push`, `пуш`, `запушить` and equivalent wording always mean a complete production release: deliver the approved changes to the production branch, wait for deployment, and verify the live site. Do not stop at pushing a feature branch and do not create a draft PR unless Sergey explicitly asks for a branch or PR.
