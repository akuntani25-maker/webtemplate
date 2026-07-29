export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  children?: Category[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string | null;
  description: string;
  features: string[];
  thumbnailUrl?: string | null;
  price: number;
  discountPrice?: number | null;
  demoType: string;
  demoUrl?: string | null;
  version?: string | null;
  fileFormat?: string | null;
  ratingAvg: number;
  ratingCount: number;
  downloadCount: number;
  purchaseCount: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  category?: { slug: string; name: string };
}

export interface Paginated<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
