<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/08fcc47f-cb23-484c-85d2-87f3ed15c3a7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Textflow brand and hosting

App repository: https://github.com/Trishil/textflow-workspace
Workspace: https://trishil.github.io/textflow-workspace/?experience=workspace
Brochure: https://trishil.github.io/textflow/

The local checkout directory keeps its existing name. Workspace visual styles live in `src/workspace.css`; all changes are scoped to the signed-in app. Existing tenant identifiers and stored records are preserved.
