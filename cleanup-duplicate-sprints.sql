-- Cleanup Duplicate Backlog Sprints
-- This removes rogue backlog sprints with timestamps in their IDs

-- STEP 1: Identify duplicate backlog sprints (those with timestamps)
SELECT 
    'Duplicate backlog sprints to be removed:' as info,
    id,
    user_id,
    title,
    created_at
FROM sprints 
WHERE is_backlog = true 
  AND id LIKE '%-[0-9][0-9][0-9][0-9][0-9]%'  -- Contains timestamp pattern
ORDER BY created_at;

-- STEP 2: Delete rogue backlog sprints (keep only the ones without timestamps)
DELETE FROM sprints 
WHERE is_backlog = true 
  AND id LIKE '%-[0-9][0-9][0-9][0-9][0-9]%'  -- Contains timestamp pattern
  AND LENGTH(id) > 45;  -- Longer IDs are the ones with timestamps

-- STEP 3: Verify cleanup - should only show proper backlog sprints
SELECT 
    'Remaining backlog sprints (should be clean):' as info,
    id,
    user_id,
    title,
    is_backlog,
    created_at
FROM sprints 
WHERE is_backlog = true 
ORDER BY created_at;

-- STEP 4: Count sprints per user (should be max 1 backlog per user)
SELECT 
    'Sprint count per user:' as info,
    user_id,
    COUNT(CASE WHEN is_backlog = true THEN 1 END) as backlog_count,
    COUNT(CASE WHEN id = 'priority' THEN 1 END) as priority_count,
    COUNT(*) as total_sprints
FROM sprints 
WHERE archived_at IS NULL
GROUP BY user_id
ORDER BY user_id;

-- SUCCESS MESSAGE
SELECT '✅ Duplicate backlog sprint cleanup completed!' as status; 