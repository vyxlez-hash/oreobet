OREOBET build fix for commit 2cd8563d5c79c7306b9d900c02ce0b2028f398d3

Replace these three files in project/:
- src/App.tsx
- src/store/auth.tsx
- tsconfig.json

Then Render:
Root Directory: project
Build Command: npm install && npm run build
Publish Directory: dist

Fixes:
- Lucide navigation tuple type errors in App.tsx
- String.replaceAll ES2021 target errors in auth.tsx
- TypeScript lib/target raised from ES2020 to ES2021

The npm audit warnings are not what caused this build to fail.
