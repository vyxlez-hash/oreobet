# OREOBET profile pictures

1. In Supabase SQL Editor, run `supabase/migrations/20260825020000_profile_avatars.sql`.
2. The migration adds `profiles.avatar_url`, creates the public `avatars` Storage bucket, and adds policies so users can only upload/update/delete their own avatar file.
3. Deploy the project to Render with Root Directory `project`, Build Command `npm install && npm run build`, Publish Directory `dist`.

Users can change their picture from Dashboard -> Settings, or click their picture at the top of Dashboard. The picture also appears beside their username in the navbar and in live chat.
