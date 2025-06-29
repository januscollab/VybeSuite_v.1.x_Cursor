/**
 * SPRINT LAYOUT CONSTANTS - FUNDAMENTAL DESIGN RULES
 * 
 * These constants define the core layout rules for the Sprint Board.
 * These rules are IMMUTABLE and must be respected throughout the application.
 */

export const SPRINT_LAYOUT_RULES = {
  /**
   * CRITICAL RULE: ALL SPRINTS EXCEPT BACKLOG ARE ALWAYS 50% WIDTH
   * 
   * This rule ensures:
   * 1. Consistent visual hierarchy
   * 2. Predictable layout behavior
   * 3. Optimal space utilization
   * 4. Clear separation between sprint types
   */
  NON_BACKLOG_SPRINT_WIDTH: '50%',
  
  /**
   * Priority Sprint Rules
   */
  PRIORITY_SPRINT: {
    WIDTH: '50%',
    POSITION: 0,
    IS_DRAGGABLE: false,
    IS_DELETABLE: false,
    GRID_COLUMN: 1, // Always first column in 2-column grid
  },
  
  /**
   * User-Defined Sprint Rules
   */
  USER_SPRINT: {
    WIDTH: '50%',
    IS_DRAGGABLE: true,
    IS_DELETABLE: true,
    GRID_LAYOUT: '2-column', // Always arranged in 2-column grid
  },
  
  /**
   * Backlog Sprint Rules (EXCEPTION)
   */
  BACKLOG_SPRINT: {
    WIDTH: '100%', // ONLY sprint that can be full width
    IS_DRAGGABLE: false,
    IS_DELETABLE: false,
    POSITION: 'last', // Always rendered last
  },
} as const;

/**
 * Grid Layout Constants
 */
export const GRID_LAYOUT = {
  /**
   * Standard 2-column grid for 50% width sprints
   */
  TWO_COLUMN: 'grid-cols-2',
  
  /**
   * Gap between sprint cards
   */
  GAP: 'gap-5',
  
  /**
   * Margin between sprint sections
   */
  SECTION_MARGIN: 'mb-5',
} as const;

/**
 * Validation function to ensure sprint layout rules are followed
 */
export const validateSprintLayout = (sprint: { id: string; isBacklog?: boolean }) => {
  const rules = SPRINT_LAYOUT_RULES;
  
  if (sprint.id === 'priority') {
    return {
      width: rules.PRIORITY_SPRINT.WIDTH,
      isDraggable: rules.PRIORITY_SPRINT.IS_DRAGGABLE,
      isDeletable: rules.PRIORITY_SPRINT.IS_DELETABLE,
    };
  }
  
  if (sprint.isBacklog) {
    return {
      width: rules.BACKLOG_SPRINT.WIDTH,
      isDraggable: rules.BACKLOG_SPRINT.IS_DRAGGABLE,
      isDeletable: rules.BACKLOG_SPRINT.IS_DELETABLE,
    };
  }
  
  // User-defined sprint
  return {
    width: rules.USER_SPRINT.WIDTH,
    isDraggable: rules.USER_SPRINT.IS_DRAGGABLE,
    isDeletable: rules.USER_SPRINT.IS_DELETABLE,
  };
};

/**
 * Type definitions for layout rules
 */
export type SprintLayoutType = 'priority' | 'user' | 'backlog';
export type SprintWidth = '50%' | '100%';