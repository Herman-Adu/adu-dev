export interface StrapiData {
  id: number;
  // The envelope carries whatever the content type defines; callers narrow
  // to a generated Entry<> rather than reading through this shape.
  [key: string]: unknown;
}

export interface StrapiResponse {
  data: StrapiData | StrapiData[];
}

export interface StrapiLocaleObject {
  id: number;
  documentId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  isDefault: boolean;
}
