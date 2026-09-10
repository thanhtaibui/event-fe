export interface EventPayload {
  title: string;
  eventBanner: string;
  eventPoster?: string;
  startDateTime: string;
  endDateTime: string;
  registrationEndDate: string;
  capacity: number;
  organizationId: string;
  categoryIds: string[];
  description: string;
  place: string;
}
