# Frontend Patterns & Conventions

## shadcn/vue Component Usage
- Components are copied into `src/components/ui/<name>/` with barrel exports
- Each component uses reka-ui primitives underneath
- Styling uses `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge)
- Button.vue uses class-variance-authority for variant/size props
- Input.vue uses `useVModel` from @vueuse/core for v-model support
- DropdownMenuItem.vue uses `reactiveOmit` + `useForwardProps` from reka-ui

## Navigation Component Architecture
- NavigationBar.vue: organism, receives userName/userEmail/avatarUrl props, composes 3 children
- NavigationSearch.vue: molecule, icon + input, no state management yet
- NavigationCreateMenu.vue: molecule, button + dropdown, 4 content type items (Prompt, Skill, Agent, Workflow)
- NavigationUserMenu.vue: molecule, avatar + dropdown, has `initials` computed prop

## Layout Pattern
- DefaultLayout.vue wraps NavigationBar + `<main>` + RouterView
- Max width: `max-w-7xl` with responsive padding (`px-4 sm:px-6 lg:px-8`)
- Used via router config (layout as parent route component)

## Tailwind Theme
- Uses oklch color system with CSS custom properties
- Dark mode via `.dark` class (custom variant)
- Standard shadcn/vue design tokens (background, foreground, primary, muted, etc.)
