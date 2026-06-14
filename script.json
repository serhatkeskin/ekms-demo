## Public routes (unauthenticated)
- `/authentication/sign-in` - Login page (username + password)
- `/authentication/sign-up` - Registration page

## Protected routes (require login)
- `/` - Redirects to `/dashboard/project`
- `/dashboard/project` - Project dashboard; lists projects with table
- `/pages` - Knowledge base page list
- `/pages/:slug` - Page detail with Slide Viewer, Subpages, toolbar (Refresh / Snapshots / Clone / PDF / DOCX)
- `/search` - Full-text search across pages and blocks
- `/profile` - User profile (Overview tab: info card + projects; Settings tab: password change)
- `/logout` - Clears session, redirects to sign-in

## Staff-only routes (require is_staff=true)
- `/management/user` - User Management table (list, edit, create users)