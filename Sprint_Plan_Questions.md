# Sprint Board - Pre-Development Questions

## Technical Clarifications Needed

### 1. Design System Reference
- **Issue**: `dls.md` file referenced but not provided
- **Current**: HTML mockups contain design tokens (`--devsuite-primary: #FC8019`)
- **Options**: 
  - Extract design system from HTML mockups
  - Wait for `dls.md` file
  - Use placeholder system

### 2. AI Integration Strategy  
- **Issue**: OpenAI integration scope unclear
- **Options**:
  - Full OpenAI API integration
  - Sophisticated mock system
  - Infrastructure with placeholder calls

### 3. Data Persistence Approach
- **Issue**: Backend strategy not specified
- **Options**:
  - localStorage with export/import
  - Supabase backend integration
  - Hybrid local + cloud approach

### 4. Drag & Drop Implementation
- **Options**:
  - `@dnd-kit/core` library (reliable)
  - Custom implementation (full control)
  - HTML5 drag & drop API

### 5. Story Numbering System
- **Current Example**: "TUNE-001"
- **Questions**:
  - Default prefix preference?
  - Starting number (001 vs 1)?
  - User customization level?

### 6. Mobile Experience Priority
- **Options**:
  - Full feature parity on mobile
  - Simplified mobile experience  
  - Desktop-first approach

### 7. Archive Management
- **Questions**:
  - Data structure approach?
  - Auto-archiving rules?
  - Storage separation strategy?

## Risk Assessment

**Breaking Change Risk: LOW**
- New application build (no existing codebase)
- Well-defined specifications
- Modular architecture planned

**Technical Complexity: MEDIUM-HIGH**  
- Multi-container drag & drop
- AI integration state management
- Complex modal validation system

**Estimated Timeline: 6-8 Development Sprints**

## Next Steps
1. Await clarification on above questions
2. Create detailed Sprint Plan with specific deliverables
3. Begin implementation starting with core infrastructure

---

*This document will be replaced with the full Sprint Plan once clarifications are provided.*