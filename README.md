# StageSpan Workspace

Configurable factory operations software for tracking production stages, raw materials, dispatch and accounts. Start with a workflow template, then configure stages, units, fields and team access for your factory.

[Product website](https://trishil.github.io/stagespan/) · [Open workspace](https://trishil.github.io/stagespan-workspace/?experience=workspace)

## Modules

- Production workflow, batch and piece tracking
- Materials, inventory and stock movements
- Dispatch, delivery notes and payments
- Receivables, payables and operating expenses
- Workflow configuration and team permissions

Industry templates include textiles and furniture. Features available to a workspace depend on its configuration and permissions.

## Development

Requires Node.js 20 or later.

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and configure Firebase and Google OAuth for your environment.
3. Start the development server with `npm run dev`.

Run `npm run build` for a production build and `npm test` for the regression tests. Keep credentials out of Git.

## Deployment

GitHub Actions builds the main branch and publishes the static app to GitHub Pages. The brochure is maintained separately in [stagespan](https://github.com/Trishil/stagespan).

## Project structure

- `src/components/`: operations screens and dialogs
- `src/domain/`: workflow, configuration and permission rules
- `src/features/`: account entry, setup, settings and administration
- `src/templates/`: industry workflow templates
- `src/workspace.css`: workspace visual system

## Contact

Product inquiries: trishilbalar92@gmail.com
