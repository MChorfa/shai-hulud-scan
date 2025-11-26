// Define proper interfaces for content sections
export interface ContentSection {
  title: string;
  content: string;
  points?: string[];
  code?: string;
  timeline?: string[];
}

export interface ContentData {
  [key: string]: {
    title: string;
    sections: ContentSection[];
  };
}
