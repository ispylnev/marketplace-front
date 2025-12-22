export interface Product {
  id: string;
  name: string;
  price: string;
  oldPrice?: string;
  image: string;
  rating: number;
  reviews: number;
  discount?: number;
  description?: string;
  category?: string;
  seller?: {
    name: string;
    rating: number;
  };
  specifications?: Record<string, string>;
  images?: string[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
  icon?: string;
}
