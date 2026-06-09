# TODO - User/Public site refactor skeleton

## Completed

- [x] Create `src/routes/adminRoutes.tsx` (admin routes wrapper)
- [x] Create `src/routes/userRoutes.tsx` (user routes wrapper)
- [x] Update `src/routes/index.tsx` to compose `adminRoutes` + `userRoutes`
- [x] Create `src/layouts/user/UserLayout.tsx`
- [x] Create user skeleton pages:
  - [x] `src/pages/user/HomePage.tsx`
  - [x] `src/pages/user/EventListPage.tsx`
  - [x] `src/pages/user/EventDetailPage.tsx`
  - [x] `src/pages/user/MyJoinedEventsPage.tsx`
  - [x] `src/pages/user/UserProfilePage.tsx`
- [x] Create user skeleton components:
  - [x] `src/components/user/UserHeader.tsx`
  - [x] `src/components/user/UserFooter.tsx`
  - [x] `src/components/user/HeroSection.tsx`
  - [x] `src/components/user/EventCard.tsx`
  - [x] `src/components/user/EventGrid.tsx`
  - [x] `src/components/user/CategorySection.tsx`
  - [x] `src/components/user/SearchBar.tsx`
  - [x] `src/components/user/EventDetailHero.tsx`
  - [x] `src/components/user/EventInfoPanel.tsx`
  - [x] `src/components/user/EventSchedule.tsx`
  - [x] `src/components/user/OrganizerInfo.tsx`
- [x] Create user skeleton styles:
  - [x] `src/styles/user/user-layout.css`
  - [x] `src/styles/user/user-home.css`
  - [x] `src/styles/user/user-event-card.css`
  - [x] `src/styles/user/user-event-detail.css`

## Next (not started)

- [ ] Create remaining folder scaffolds (components/shared, hooks/user, services/user, styles/shared) if needed
- [ ] Create `src/components/user/` exports barrel (index.ts) nếu bạn muốn
- [ ] Implement `UserHeader` / `UserFooter` skeleton content placeholders according to layout (no final UI yet)
- [ ] Update `UserLayout` to resolve component import errors (ts) once TS resolves folders
- [ ] Create admin layout alias review (AdminLayout) and later move admin routes/pages gradually if desired
