-- Complete User Data Cleanup SQL Script (Updated for Fixed Database)
-- Run remove-sprint-protection.sql FIRST, then use this script
-- Replace 'USER_ID_HERE' with the actual user ID you want to delete

-- EXAMPLE FOR CURRENT USER: cb66cb55-350b-4151-bd16-2b2f5d8c4f41

-- METHOD 1: Quick cleanup (copy and replace USER_ID_HERE with actual ID)
-- 1. Delete user stories
DELETE FROM stories 
WHERE sprint_id IN (
    SELECT id FROM sprints WHERE user_id = 'USER_ID_HERE'
);

-- 2. Delete user sprints (including Priority and Backlog)
DELETE FROM sprints 
WHERE user_id = 'USER_ID_HERE';

-- 3. Delete user settings
DELETE FROM user_settings 
WHERE user_id = 'USER_ID_HERE';

-- 4. Delete user roles
DELETE FROM user_roles 
WHERE user_id = 'USER_ID_HERE';

-- 5. Verify cleanup (should return 0 for all)
SELECT 
    'Cleanup verification:' as info,
    (SELECT COUNT(*) FROM stories WHERE sprint_id IN (SELECT id FROM sprints WHERE user_id = 'USER_ID_HERE')) as remaining_stories,
    (SELECT COUNT(*) FROM sprints WHERE user_id = 'USER_ID_HERE') as remaining_sprints,
    (SELECT COUNT(*) FROM user_settings WHERE user_id = 'USER_ID_HERE') as remaining_settings,
    (SELECT COUNT(*) FROM user_roles WHERE user_id = 'USER_ID_HERE') as remaining_roles;

-- METHOD 2: For cb66cb55-350b-4151-bd16-2b2f5d8c4f41 (ready to run)
/*
-- 1. Delete user stories
DELETE FROM stories 
WHERE sprint_id IN (
    SELECT id FROM sprints WHERE user_id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41'
);

-- 2. Delete user sprints (including Priority and Backlog)
DELETE FROM sprints 
WHERE user_id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41';

-- 3. Delete user settings
DELETE FROM user_settings 
WHERE user_id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41';

-- 4. Delete user roles
DELETE FROM user_roles 
WHERE user_id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41';

-- 5. Verify cleanup
SELECT 
    'Cleanup verification:' as info,
    (SELECT COUNT(*) FROM stories WHERE sprint_id IN (SELECT id FROM sprints WHERE user_id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41')) as remaining_stories,
    (SELECT COUNT(*) FROM sprints WHERE user_id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41') as remaining_sprints,
    (SELECT COUNT(*) FROM user_settings WHERE user_id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41') as remaining_settings,
    (SELECT COUNT(*) FROM user_roles WHERE user_id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41') as remaining_roles;
*/

-- METHOD 3: Advanced - with user info lookup first
/*
-- See user info before deletion
SELECT 
    'User to be deleted:' as info,
    id, 
    email, 
    created_at,
    (SELECT COUNT(*) FROM sprints WHERE user_id = auth.users.id) as sprint_count,
    (SELECT COUNT(*) FROM stories WHERE sprint_id IN (SELECT id FROM sprints WHERE user_id = auth.users.id)) as story_count
FROM auth.users 
WHERE id = 'cb66cb55-350b-4151-bd16-2b2f5d8c4f41';
*/ 

DELETE FROM sprints 
WHERE is_backlog = true 
  AND id LIKE '%-[0-9][0-9][0-9][0-9][0-9]%'
  AND LENGTH(id) > 45; 