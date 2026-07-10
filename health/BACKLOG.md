- subscribe logic not working

- reset password logic need review

- forgot password logic need review

- unsubscirbe logic need review

- unsubscribe page an logic need review

- implement create article

- update documentation

- slow page navigation with pagination (fetch cache issues)
Option 2: SWR or TanStack Query (recommended)
Pros:
Industry-standard caching
Automatic deduplication
Background revalidation
Prefetching support
Works well with server components
How it works:
Create a client component wrapper for pagination
Use SWR/TanStack Query to fetch and cache pages
Cache key: category-${category}-page-${page}-locale-${locale}
Instant navigation for cached pages
Implementation complexity: Medium (requires client component wrapper)