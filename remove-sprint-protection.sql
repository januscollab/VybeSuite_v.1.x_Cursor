-- Remove Overly Restrictive Sprint Protection Trigger
-- This allows backend/admin deletion while keeping UI protection

-- STEP 1: Drop the dependent trigger first (the one that uses the function)
DROP TRIGGER IF EXISTS enforce_sprint_position_on_insert ON sprints;

-- STEP 2: Drop any other triggers that might use the protection function
DROP TRIGGER IF EXISTS protect_priority_sprint_trigger ON sprints;

-- STEP 3: Now drop the protection function (dependencies are gone)
DROP FUNCTION IF EXISTS protect_priority_sprint();

-- ALTERNATIVE: If you want to be more aggressive, use CASCADE to drop everything
-- DROP FUNCTION IF EXISTS protect_priority_sprint() CASCADE;

-- STEP 4: Verify all triggers are removed from sprints table
SELECT 
    'Current triggers on sprints table:' as info,
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'sprints'
ORDER BY trigger_name;

-- STEP 5: Verify the protection function is removed  
SELECT 
    'Current functions containing protect_priority_sprint:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%protect_priority_sprint%';

-- STEP 6: List all remaining functions (for reference)
SELECT 
    'All remaining custom functions:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- STEP 7: Test deletion capability (optional - remove comment to test)
/*
-- Test deleting a regular sprint (should work)
SELECT 'Testing sprint deletion capability...' as info;

-- This should now work without the trigger blocking it
-- Uncomment and modify with actual sprint ID to test:
-- DELETE FROM sprints WHERE id = 'test-sprint-id' AND user_id = 'test-user-id';
*/

-- SUCCESS MESSAGE
SELECT '✅ Sprint protection trigger and function removed successfully!' as result,
       'Priority and Backlog sprints can now be deleted via SQL/backend' as note,
       'UI protection remains in place via application code' as ui_protection; 