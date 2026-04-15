---
name: create-nextjs-component
description: Use this skill when creating new React components, UI elements, or features in Next.js applications
---

# React Component Creation for Next.js

## References

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask. Use the Context7 Library websites/shadcn_io.

## Core Rules

- **shadcn first** - Always check if a suitable shadcn/ui component exists before building from scratch. Use it as the base and compose/extend on top. Install the base component if it doesn't exist in the project.
- **DO NOT OVERENGINEER** - Keep code simple, ≤100 lines per component
- **One component per file** - Create new files for every component
- **Complete implementations** - No placeholders, TODOs, or incomplete code
- **TypeScript strict mode** - Explicit types, no `any`
- **Server by default** - Only add `"use client"` when needed
- **Props over data fetching** - Presentational components MUST receive data via props, NEVER fetch directly

**1. Presentational vs Container Components**

- UI components in `src/components/ui/` must be presentational only
- Never hardcode data arrays, objects, or business logic inside UI components
- Data and behavior must be passed via props from parent/container components
- Container components (in `src/components/layout/` or pages) manage data and logic

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
interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**Item Component** (lowest level, pure props):

```tsx
// components/products/ProductCard.tsx - SERVER COMPONENT
interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
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
  return <div>{data.title}</div>;
}
```

### Client Components

```tsx
"use client"; // Only when you need: hooks, events, browser APIs

import { useState } from "react";

export default function Counter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Client components with data**: Receive via props, use hooks for client-side state only:

```tsx
"use client";

interface ProductFormProps {
  product: Product; // Passed from parent
}

export default function ProductForm({ product }: ProductFormProps) {
  const [name, setName] = useState(product.name);
  // Client state for form interactions only
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

## File Organization

```
src/
├── app/              # Pages, layouts, routes
├── components/
│   ├── ui/          # shadcn/ui components
│   └── [feature]/   # Feature components
├── lib/             # Utilities (cn, utils)
└── hooks/           # Custom hooks
```

**Naming**: Directories = `kebab-case/`, Components = `PascalCase.tsx`

## Styling

### Tailwind + cn() Utility

```tsx
import { cn } from "@/lib/utils";

export default function Card({ className, variant }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        variant === "highlight" && "border-blue-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

**Best Practices**:

- Tailwind only - no custom CSS unless necessary
- Semantic colors: `bg-background`, `text-foreground`, `border-border`
- Responsive: `text-sm md:text-base lg:text-lg`

## shadcn/ui

**Check shadcn first** - Before building any UI component, check whether shadcn/ui already provides a suitable base. Common components to use from shadcn: `Button`, `Input`, `Card`, `Dialog`, `Select`, `Checkbox`, `Badge`, `Table`, `Tabs`, `Tooltip`, `DropdownMenu`, `Sheet`, `Form`, and more. Only build from scratch when no suitable shadcn component exists.

**Compose, don't modify** - Wrap shadcn components, never edit library files:

```tsx
import { Button } from "@/components/ui/button";

export default function SubmitButton(props: Props) {
  return <Button variant="default" size="lg" {...props} />;
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

**Extending shadcn types**:

```tsx
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
<Input value={value} onChange={(e) => setValue(e.target.value)} />;
```

## Checklist

- [ ] Correct directory (`src/components/` or `src/app/`)
- [ ] TypeScript with explicit types
- [ ] `@/*` path aliases for imports
- [ ] Tailwind + `cn()` for styling
- [ ] Server component by default (no `"use client"` unless needed)
- [ ] Properly exported
- [ ] No TODOs or placeholders
- [ ] Follows existing codebase patterns

## Anti-Patterns

❌ Building a component from scratch when a shadcn/ui base exists
❌ Multiple components in one file
❌ Modifying shadcn/ui files directly
❌ Using `any` type
❌ Custom CSS with Tailwind
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
