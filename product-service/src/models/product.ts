import { Stock } from './stock';

export type Product = {
  id: string;
  price: number;
  title: string;
  description: string;
};

export type ProductDto = Product & Omit<Stock, 'product_id'>;
export type ProductPostBody = Omit<ProductDto, 'id'>; 
