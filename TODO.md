# TODO

- [x] Inspect existing repo structure and find API/service patterns
- [x] Create `AcceptInvitePage` component (4 states: loading/success/declined/error)
- [x] Create separate CSS for page (module css)
- [x] Implement URL handling: read query params via `useSearchParams`, infer action from pathname, POST to `/invitations/accept` or `/invitations/decline`
- [x] Render full-viewport centered card with per-state gradients and buttons
- [ ] Wire routes for `/events/accept` and `/events/decline` to this page (if not already handled elsewhere)
- [ ] Remove/avoid deprecated placeholder `src/pages/invite/accept-invite-page.css` if your build prefers only CSS modules
