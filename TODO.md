# TODO: Implement Create Event Feature

## Steps:

1. [ ] Create src/types/event/create.ts - CreateEventPayload type
2. [ ] Edit src/services/admin/event.service.ts - Add createEvent method
3. [ ] Create src/hooks/admin/event/useCreateEvent.ts - useMutation hook
4. [ ] Create src/components/event/createEvent.tsx - Modal form component (focus create)
5. [ ] Edit src/pages/admin/event/Event.tsx - Import and render CreateEventPopup when popupType==='create'
6. [ ] Test: Run dev server, admin/event → Create → form submit → list refresh
7. [ ] Later: updateEvent similarly

All steps complete. CreateEvent component ready, integrated into Event page. Poster full-width preview, form matches schema. Test in browser.
