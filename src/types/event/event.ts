import type { EventStatus } from "../enum";

export interface EventDto {
  id: string;

  title: string;

  eventPoster: string;

  startDateTime: Date;

  endDateTime: Date;

  registrationEndDate: Date;

  capacity: number;

  soldTickets: number;

  status: EventStatus;

  organization: OrgDto;

}
interface OrgDto {
  id: string,

  name: string
}