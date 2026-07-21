---
name: create-nextjs-component
description: Use this skill when creating new React components, UI elements, or features in Next.js applications
---

# React Component Creation for Next.js

## References

Before writing any markup, discover the closest Astryx primitive via the CLI — do not guess component names or reach for raw HTML:

```bash
npx astryx build "<idea>"       # closest page/block/component kit
npx astryx component <Name>     # props + examples for a specific component
npx astryx template <name>      # scaffold or study a page/block recipe
```

## Core Rules

- **Astryx first** - Always check whether `@astryxdesign/core` already provides the component before building from scratch. Never use a raw `<div>` for layout, spacing, buttons, cards, inputs, dialogs, dropdowns, or avatars — Astryx components do all layout/spacing.
- **DO NOT OVERENGINEER** - Keep code simple, ≤100 lines per component
- **One component per file** - Create new files for every component
- **Complete implementations** - No placeholders, TODOs, or incomplete code
- **TypeScript strict mode** - Explicit types, no `any`
- **Server by default** - Only add `"use client"` when needed
- **Props over data fetching** - Presentational components MUST receive data via props, NEVER fetch directly

**1. Presentational vs Container Components**

- UI components in `src/components/` must be presentational only
- Never hardcode data arrays, objects, or business logic inside UI components
- Data and behavior must be passed via props from parent/container components
- Container components (pages, or feature-level components) manage data and logic

**2. Props-Based Configuration**

- All dynamic content (data, text, handlers) must be passed as props
- Use TypeScript interfaces to define clear prop contracts
- Provide sensible defaults for optional props
- Export shared types to `src/types/` for reusability

**3. Component Responsibilities**

- UI components handle presentation and user interaction events only
- Parent components handle data fetching, state management, and business logic
- Use callback props (e.g., `onSearch`, `onChange`) to communicate events up to parent
- Components should maintain only UI-related state (e.g., input values, open/closed states)

**Page/Route Component** (top-level, fetches data):

```tsx
// app/products/page.tsx - SERVER COMPONENT
export default async function ProductsPage() {
  const products = await fetch("...").then((r) => r.json());
  return <ProductList products={products} />;
}
```

## Data Flow Architecture

### ✅ CORRECT: Top-level fetches data, presentational receives props

**List Component** (receives data, maps to items):

```tsx
// components/products/ProductList.tsx - SERVER COMPONENT
import { VStack } from "@astryxdesign/core/Stack";

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  return (
    <VStack gap={4}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </VStack>
  );
}
```

**Item Component** (lowest level, pure props):

```tsx
// components/products/ProductCard.tsx - SERVER COMPONENT
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card>
      <Heading level={3}>{product.name}</Heading>
      <Text>{product.price}</Text>
    </Card>
  );
}
```

### ❌ WRONG: Lower-level component fetching data

```tsx
// ❌ BAD - ProductCard should NOT fetch its own data
export default async function ProductCard({
  productId,
}: {
  productId: string;
}) {
  const product = await fetch(`/api/products/${productId}`).then((r) =>
    r.json(),
  );
  return <div>{product.name}</div>;
}
```

## Component Types

### Server Components (Default)

**Top-level components CAN fetch data**:

```tsx
// Pages, layouts, or top-level route components
export default async function Page() {
  const data = await fetch("...").then((r) => r.json());
  return <MyComponent data={data} />;
}
```

**Lower-level components MUST receive props**:

```tsx
// Reusable, presentational components
interface MyComponentProps {
  data: DataType;
}

export default function MyComponent({ data }: MyComponentProps) {
  return <Text>{data.title}</Text>;
}
```

### Client Components

```tsx
"use client"; // Only when you need: hooks, events, browser APIs

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";

export default function Counter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  return <Button onClick={() => setCount(count + 1)}>{count}</Button>;
}
```

**Client components with data**: Receive via props, use hooks for client-side state only:

```tsx
"use client";

import { TextInput } from "@astryxdesign/core/TextInput";

interface ProductFormProps {
  product: Product; // Passed from parent
}

export default function ProductForm({ product }: ProductFormProps) {
  const [name, setName] = useState(product.name);
  // Client state for form interactions only
  return <TextInput label="Name" value={name} onChange={(value) => setName(value)} />;
}
```

## File Organization

```
src/
├── app/              # Pages, layouts, routes
├── components/       # Feature components, composed from Astryx primitives
├── lib/             # Utilities (cn, utils)
└── hooks/           # Custom hooks
```

**Naming**: Directories = `kebab-case/`, Components = `PascalCase.tsx`

## Styling

### Astryx props first, Tailwind + cn() as the fallback

```tsx
import { Card } from "@astryxdesign/core/Card";
import { cn } from "@/lib/utils";

export default function HighlightCard({ className, variant, children }: Props) {
  return (
    <Card
      className={cn(
        variant === "highlight" && "border-accent",
        className,
      )}
    >
      {children}
    </Card>
  );
}
```

**Best Practices**:

- Use the component's own props before reaching for a class name — check `npx astryx component <Name>` for a prop that already covers the need.
- Tailwind utility classes are the token-backed escape hatch for the rare gap, not the default — always backed by `@astryxdesign/core/tailwind-theme.css` tokens (`bg-surface`, `text-primary`, `rounded-lg`, ...), never raw hex/px values or inline `style={{}}`.
- Responsive: `text-sm md:text-base lg:text-lg`

## Astryx

**Check Astryx first** - Before building any UI element, run `npx astryx search "<query>"` or `npx astryx component --list` to find the closest primitive. Common components: `Button`, `IconButton`, `TextInput`, `Card`, `Dialog`, `Select`, `Checkbox`, `Badge`, `Table`, `Tabs`, `Tooltip`, `DropdownMenu`, `Avatar`, and more (150 total). Only build from scratch when no suitable Astryx component exists.

**Compose, don't fork** - Wrap Astryx components, never edit library files (use `npx astryx swizzle <Name>` only for deliberate deep customization):

```tsx
import { Button } from "@astryxdesign/core/Button";

export default function SubmitButton(props: Props) {
  return <Button variant="primary" size="lg" {...props} />;
}
```

## TypeScript Patterns

```tsx
interface ComponentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Component({ title, className }: ComponentProps) {
  return <div className={cn("base-styles", className)}>{title}</div>;
}
```

**Extending Astryx types**:

```tsx
import type { Button } from "@astryxdesign/core/Button";

interface CustomProps extends React.ComponentProps<typeof Button> {
  showIcon?: boolean;
}
```

## Common Patterns

**Icons (Lucide)**:

```tsx
import { Heart, Share2 } from "lucide-react";
<Heart className="h-4 w-4" />;
```

**Forms with state**:

```tsx
"use client";
const [value, setValue] = useState("");
<TextInput label="Search" value={value} onChange={(value) => setValue(value)} />;
```

## Checklist

- [ ] Correct directory (`src/components/` or `src/app/`)
- [ ] TypeScript with explicit types
- [ ] `@/*` path aliases for imports
- [ ] Astryx component props used before falling back to Tailwind + `cn()`
- [ ] Server component by default (no `"use client"` unless needed)
- [ ] Properly exported
- [ ] No TODOs or placeholders
- [ ] Follows existing codebase patterns

## Anti-Patterns

❌ Building a component from scratch when an Astryx base exists
❌ Raw `<div>` for layout/spacing/buttons/cards that Astryx covers
❌ Multiple components in one file
❌ Modifying `@astryxdesign/core` files directly
❌ Using `any` type
❌ Reaching for Tailwind before checking component props
❌ Unnecessary `"use client"`
❌ Components over 100 lines
❌ Incomplete implementations
❌ **Lower-level components fetching their own data**
❌ **Passing IDs down when you can pass the full object**
❌ **API calls in presentational components**

## Data Flow Rules

### When to Fetch Data

✅ **Fetch at these levels**:

- Page components (`app/*/page.tsx`)
- Layout components (`app/*/layout.tsx`)
- Route handlers (`app/*/route.ts`)
- Top-level feature components (sparingly)

❌ **NEVER fetch at these levels**:

- Presentational/UI components
- List item components (Card, Row, etc.)
- Form field components
- Any component nested 2+ levels deep

### Prop Passing Pattern

```tsx
// ✅ GOOD: Pass complete objects
<ProductCard product={product} />

// ❌ BAD: Pass IDs requiring child to fetch
<ProductCard productId={product.id} />
```

### Component Hierarchy Example

```
Page (async, fetches)
  └─> FeatureList (receives array via props)
       └─> FeatureCard (receives object via props)
            └─> FeatureButton (receives primitives via props)
```

**Rule**: Only the top component fetches. All children receive complete data via props.
