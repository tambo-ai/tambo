export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

export interface CreateBookmarkRequest {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
}

export interface UpdateBookmarkRequest {
  title?: string;
  url?: string;
  description?: string;
  tags?: string[];
}
