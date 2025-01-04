import { Status } from "../utils/schemas";

export interface ImageSource {
  title: string;
  imgUrl: string;
  webUrl: string;
  summary: string;
}

export interface ImageScrapeStatus {
  scrapeStatus: Status;
  source: ImageSource;
  error?: string;
}
