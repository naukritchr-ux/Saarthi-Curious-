-- Script to seed empty streak records for users who don't have a learning_streaks entry
-- This ensures every user has exactly one streak record with default values

INSERT INTO public.learning_streaks (user_id, current_streak, longest_streak, last_activity_date, total_learning_days, updated_at, freezes)
SELECT 
    u.user_id,
    0 as current_streak,
    0 as longest_streak,
    NULL as last_activity_date,
    0 as total_learning_days,
    NOW() as updated_at,
    0 as freezes
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.learning_streaks ls WHERE ls.user_id = u.user_id
)
ON CONFLICT (user_id) DO NOTHING; -- Ensures only one record per user

-- Verify the inserted records
SELECT 'Inserted streak records' as status, COUNT(*) as count
FROM public.learning_streaks
WHERE current_streak = 0 AND longest_streak = 0 AND total_learning_days = 0;
