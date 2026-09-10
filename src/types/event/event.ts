import type { EventStatus } from "../enum";

export interface CategoryDto {
  id: string;
  name: string;
  slug?: string;
  code?: string;
}

export interface EventDto {
  id: string;

  title: string;

  eventBanner?: string;

  eventPoster: string;

  description: string;

  place: string;

  startDateTime: string | Date;

  endDateTime: string | Date;

  eventTime?: string | Date;

  registrationEndDate: string | Date;

  capacity: number;

  soldTickets: number;

  status: EventStatus;

  organization: OrgDto;

  categories?: CategoryDto[];

}
interface OrgDto {
  id: string,

  name: string

  isVerified?: boolean;

  isve?: boolean;
}
