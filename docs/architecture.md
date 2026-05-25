# Architecture Documentation - Bolão Copa 2026

## Executive Summary

This document outlines the recommended architecture pattern for the Bolão Copa 2026 application, a Next.js 16 World Cup prediction pool platform. The architecture emphasizes **scalability, maintainability, testability, and clear separation of concerns** while maintaining the existing Next.js App Router and Supabase backend integration.

---

## Current State Analysis

### Existing Structure
```
src/
├── app/
│   ├── page.tsx          ❌ Monolithic component with all business logic
│   ├── layout.tsx        ✓ Well-structured
│   └── globals.css       ✓ Well-structured
├── components/
│   └── ui/               ✓ Basic UI components
└── lib/
    └── utils.ts          ✓ Shared utilities
```

### Problems with Current Architecture
1. **Monolithic `page.tsx`**: Contains all state management, Supabase queries, business logic, UI rendering, and event handlers in a single file
2. **No data layer**: Supabase queries scattered throughout components
3. **No type definitions**: Missing TypeScript interfaces for domain models
4. **No service/utility layer**: Calculations for scoring, standings, and rankings embedded in page
5. **Limited componentization**: UI logic not separated from business logic
6. **Difficult testing**: Business logic tightly coupled to React components
7. **Scalability concerns**: Adding features requires modifying large files

---

## Recommended Architecture Pattern: Layered Architecture with Feature-Based Organization

### Pattern Description

We recommend a **hybrid approach** combining:
- **Layered architecture**: Clear separation between presentation, business logic, and data layers
- **Feature-based file organization**: Grouping related features together
- **Domain-driven design principles**: Organizing around business domains (predictions, ranking, admin, etc.)

### Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│         Presentation Layer (UI/Components)          │
│  - React components with hooks                      │
│  - No business logic, only display logic            │
│  - Connected to Custom Hooks                        │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│   Custom Hooks & Application Logic Layer            │
│  - useAuth(), usePredictions(), useRanking()        │
│  - State management with React hooks                │
│  - Orchestration of services                        │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│        Business Logic Layer (Services)              │
│  - Calculations: scoring, standings, rankings       │
│  - Business rule implementations                    │
│  - Pure functions for testability                   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│        Data Access Layer (Supabase Services)        │
│  - Supabase client operations                       │
│  - Query builders, error handling                   │
│  - Data transformation/mapping                      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│         External Services (Supabase)                │
│  - Database tables (players, games, predictions)    │
│  - Real-time subscriptions (if added)               │
└─────────────────────────────────────────────────────┘
```

---

## Proposed File Structure

```
src/
├── app/
│   ├── layout.tsx                      # Root layout (unchanged)
│   ├── page.tsx                        # Main entry point (simplified)
│   ├── globals.css                     # Global styles (unchanged)
│   └── providers.tsx                   # React context providers (new)
│
├── components/
│   ├── ui/                             # Shadcn/UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── layouts/                        # Layout components (new)
│   │   ├── AppLayout.tsx               # Main app layout with tabs
│   │   └── AuthLayout.tsx              # Auth form layout
│   │
│   ├── sections/                       # Feature sections (new)
│   │   ├── PredictionsSection.tsx      # Predictions tab
│   │   ├── LeaderboardSection.tsx      # Ranking tab
│   │   ├── KnockoutSection.tsx         # Matamata tab
│   │   ├── StandingsSection.tsx        # Classificação tab
│   │   └── AdminSection.tsx            # Admin tab
│   │
│   ├── forms/                          # Reusable form components (new)
│   │   ├── AuthForm.tsx                # Login form
│   │   └── PredictionForm.tsx          # Prediction entry
│   │
│   └── features/                       # Feature-specific components (new)
│       ├── RandomPredictor/
│       │   ├── RandomPredictor.tsx
│       │   ├── SingleGameRandomPredictor.tsx
│       │   └── scoreAlgorithm.ts
│       │
│       ├── PredictionGame/
│       │   ├── GameRow.tsx
│       │   └── GameCard.tsx
│       │
│       └── StandingsTable/
│           ├── StandingsTable.tsx
│           └── TeamRow.tsx
│
├── hooks/                              # Custom React hooks (new)
│   ├── useAuth.ts                      # Authentication logic
│   ├── usePredictions.ts               # Predictions CRUD
│   ├── useGames.ts                     # Games data
│   ├── useRanking.ts                   # Leaderboard calculations
│   ├── useStandings.ts                 # Group standings
│   ├── useKnockout.ts                  # Knockout bracket
│   └── useLocalStorage.ts              # Local storage utilities
│
├── services/                           # Business logic layer (new)
│   ├── authService.ts                  # Auth helper functions
│   │
│   ├── predictions/
│   │   ├── predictionCalculations.ts   # Scoring logic
│   │   └── predictionValidation.ts     # Prediction rules
│   │
│   ├── standings/
│   │   ├── standingsCalculations.ts    # Group standings logic
│   │   ├── bestThirdPlace.ts           # Third place ranking
│   │   └── knockoutQualification.ts    # Knockout qualification logic
│   │
│   ├── ranking/
│   │   └── leaderboardCalculations.ts  # Overall ranking logic
│   │
│   └── supabase/                       # Data access layer (new)
│       ├── supabaseClient.ts           # Supabase client initialization
│       ├── playersService.ts           # Players table operations
│       ├── gamesService.ts             # Games table operations
│       ├── predictionsService.ts       # Predictions table operations
│       └── notificationsService.ts     # Notifications (future)
│
├── lib/
│   ├── utils.ts                        # Utility functions (existing)
│   ├── constants.ts                    # App constants (new)
│   └── types.ts                        # Shared TypeScript types (new)
│
├── types/                              # Domain models (new)
│   ├── player.ts
│   ├── game.ts
│   ├── prediction.ts
│   ├── standings.ts
│   └── ranking.ts
│
└── config/                             # Configuration (new)
    └── scoring.ts                      # Scoring configuration
```

---

## Key Architectural Decisions & Reasoning

### 1. **Layered Architecture with Feature-Based Organization**
**Why**: 
- Provides clear separation of concerns
- Makes code more maintainable as the application grows
- Enables parallel development on different features
- Simplifies testing by isolating business logic

**How**: 
- Business logic stays in `/services` (pure functions)
- React logic stays in `/hooks` and `/components`
- Components focus purely on rendering

---

### 2. **Custom Hooks as Orchestration Layer**
**Why**:
- Encapsulates component logic separately from presentation
- Enables code reuse across multiple components
- Aligns with modern React patterns
- Easier to test than tightly coupled components

**Example Pattern**:
```typescript
// hooks/usePredictions.ts - reusable logic
export function usePredictions() {
  const [predictions, setPredictions] = useState([]);
  
  const savePrediction = async (prediction: Prediction) => {
    const result = await predictionsService.upsertPrediction(prediction);
    setPredictions([...predictions, result]);
  };
  
  return { predictions, savePrediction };
}
```

---

### 3. **Services Layer for Business Logic**
**Why**:
- Keeps business rules separate from UI logic
- Makes functions testable without React dependencies
- Centralizes domain knowledge
- Enables code reuse across different interfaces

**Example Pattern**:
```typescript
// services/predictions/predictionCalculations.ts - pure business logic
export function calculatePredictionPoints(
  prediction: Prediction,
  officialScore: GameScore
): number {
  if (scoresMatch(prediction, officialScore)) return 15;
  if (outcomeMatches(prediction, officialScore)) return 7;
  // ... more logic
  return 0;
}
```

---

### 4. **Data Access Layer (Supabase Services)**
**Why**:
- Abstracts database operations from business logic
- Centralizes error handling and data transformation
- Makes it easier to switch databases or add caching
- Provides a single source of truth for Supabase queries

**Example Pattern**:
```typescript
// services/supabase/predictionsService.ts
export const predictionsService = {
  async getPredictionsForPlayer(playerId: string) {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('player_id', playerId);
    
    if (error) throw new Error(`Failed to fetch predictions: ${error.message}`);
    return data;
  },
  
  async upsertPrediction(prediction: Prediction) {
    // Database operation with error handling
  }
};
```

---

### 5. **Centralized Type Definitions**
**Why**:
- Ensures type consistency across the application
- Makes refactoring safer
- Improves IDE autocomplete and developer experience
- Serves as documentation

**Structure**:
```typescript
// types/prediction.ts
export interface Prediction {
  id: string;
  player_id: string;
  game_id: string;
  predicted_score_a: number;
  predicted_score_b: number;
  created_at: string;
  updated_at: string;
}

export interface GameScore {
  official_score_a: number;
  official_score_b: number;
}
```

---

### 6. **Component Hierarchy: Sections → Features → UI**
**Why**:
- Clear parent-child relationships
- Sections are feature-specific containers
- Features are reusable components
- UI components are purely presentational

**Flow**:
```
Page.tsx
  └── AppLayout
      ├── PredictionsSection (section)
      │   ├── RandomPredictor (feature)
      │   └── GameRow (feature) × N
      │       └── SingleGameRandomPredictor
      │           └── Button (UI)
      ├── LeaderboardSection (section)
      │   └── StandingsTable (feature)
      │       └── TeamRow (feature)
      └── ...
```

---

### 7. **Separation of Concerns in Data Access**
**Why**:
- `playersService` handles authentication and player data
- `gamesService` handles game queries and updates
- `predictionsService` handles prediction CRUD
- Each service has a single responsibility
- Makes testing easier with service mocks

---

## Implementation Roadmap

### Phase 1: Foundation (Immediate)
1. Create `/types` with domain models
2. Create `/lib/constants.ts` for configuration
3. Create Supabase services in `/services/supabase/`
4. Extract authentication logic to `authService.ts`

### Phase 2: Business Logic (Week 1)
1. Extract calculation logic to `/services/predictions/`
2. Extract standings calculation to `/services/standings/`
3. Extract ranking calculation to `/services/ranking/`
4. Add validation functions

### Phase 3: Hooks Layer (Week 1-2)
1. Create custom hooks in `/hooks/`
2. Implement `useAuth`, `usePredictions`, `useGames`, `useRanking`, etc.
3. Move state management logic out of `page.tsx`

### Phase 4: Component Refactoring (Week 2-3)
1. Create section components in `/components/sections/`
2. Create feature components in `/components/features/`
3. Break down `page.tsx` into smaller, focused components
4. Update `page.tsx` to compose sections

### Phase 5: Polish & Testing (Week 3-4)
1. Add TypeScript strict mode checks
2. Add unit tests for services
3. Add integration tests for hooks
4. Document component APIs
5. Add error boundary components

---

## Benefits of This Architecture

### Maintainability
- ✅ Code organized by feature and responsibility
- ✅ Easy to locate and modify specific functionality
- ✅ Clear relationships between components and services

### Scalability
- ✅ New features can be added with minimal impact on existing code
- ✅ Easy to add new services or components
- ✅ Reduced file size makes individual files easier to understand

### Testability
- ✅ Business logic is pure and easily testable
- ✅ Services can be mocked in tests
- ✅ Components can be tested in isolation with mock hooks

### Reusability
- ✅ Hooks can be used by multiple components
- ✅ Services can be shared across the application
- ✅ UI components are generic and reusable

### Developer Experience
- ✅ Clear mental model of application structure
- ✅ Easy for new developers to understand where code lives
- ✅ Better IDE support with properly typed services and hooks

---

## Technology Alignment

| Layer | Technology | Pattern |
|-------|-----------|---------|
| **Presentation** | React 19 + TypeScript | Functional components with hooks |
| **State Management** | React Hooks + Context (optional) | Custom hooks for feature logic |
| **Business Logic** | TypeScript + Pure Functions | Services + Utilities |
| **Data Access** | Supabase JavaScript SDK | Service abstraction layer |
| **Styling** | Tailwind CSS + shadcn/ui | Component scoped utilities |
| **Build** | Next.js 16 App Router | File-based routing |

---

## Integration with Existing Tech Stack

### Next.js 16 App Router
- ✅ The `/app/page.tsx` remains the entry point
- ✅ Server components can be added in `/app` as needed
- ✅ Middleware can be added for auth/redirects

### TypeScript
- ✅ All services and types are strongly typed
- ✅ IDE provides full autocomplete support
- ✅ Compile-time type checking prevents errors

### Tailwind CSS + shadcn/ui
- ✅ UI components remain in `/components/ui/`
- ✅ Section and feature components extend UI components
- ✅ Consistent styling through utility classes

### Supabase
- ✅ Centralized client in `services/supabase/supabaseClient.ts`
- ✅ All Supabase operations go through service layer
- ✅ Easy to add caching, subscriptions, or real-time features

---

## Migration Strategy

### Step 1: No Breaking Changes
- Add new directories alongside existing code
- Build new structure in parallel
- Keep existing `page.tsx` functional

### Step 2: Extract Incrementally
- Move one feature at a time (e.g., auth first)
- Create tests as you move code
- Validate in development

### Step 3: Replace Gradually
- Replace page components one section at a time
- Use git branches to manage changes
- Code review before merging

### Step 4: Finalize
- Remove old code once new code is tested
- Update documentation
- Add developer guidelines

---

## File Size Expectations

### Current State
- `src/app/page.tsx`: ~1000+ lines (estimated)

### After Refactoring
- `src/app/page.tsx`: ~100-150 lines (entry point only)
- `src/components/sections/`: ~100-200 lines per file
- `src/services/`: ~50-200 lines per file
- `src/hooks/`: ~50-150 lines per file
- Multiple smaller, focused files instead of one monolith

---

## Maintenance & Evolution

### Adding a New Feature
1. Create feature type in `/types/` if needed
2. Add service logic in `/services/` if needed
3. Create custom hook in `/hooks/` for state management
4. Create feature component(s) in `/components/features/`
5. Use in section components

### Modifying Existing Logic
1. Find service in `/services/` containing the logic
2. Update service function with tests
3. Hook automatically reflects changes
4. Component re-renders with new data

### Debugging Data Flow
1. Start at component
2. Check which hook is used
3. Find hook implementation in `/hooks/`
4. Check which service is called
5. Review service in `/services/`

---

## Conclusion

This architecture provides a solid foundation for the Bolão Copa 2026 application while maintaining compatibility with Next.js 16 and Supabase. It emphasizes **clarity, maintainability, and scalability** while enabling the team to add features and make changes with confidence.

The layered approach with feature-based organization creates natural boundaries between concerns, making the codebase easier to understand, test, and extend over time.

---

## Quick Reference: Where Things Go

| Type of Code | Location | Example |
|---|---|---|
| React components (UI only) | `/components/ui/` | `Button.tsx`, `Card.tsx` |
| Section containers | `/components/sections/` | `PredictionsSection.tsx` |
| Feature components | `/components/features/` | `GameRow.tsx`, `RandomPredictor.tsx` |
| State management | `/hooks/` | `usePredictions.ts` |
| Business calculations | `/services/` | `predictionCalculations.ts` |
| Supabase operations | `/services/supabase/` | `predictionsService.ts` |
| Type definitions | `/types/` | `prediction.ts` |
| Constants & config | `/lib/constants.ts` | `SCORING_RULES` |
| Utilities | `/lib/utils.ts` | `cn()` utility |

