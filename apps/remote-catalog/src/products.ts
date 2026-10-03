export interface Product {
  id: string;
  name: string;
  stock: 'in-stock' | 'low' | 'out';
  price: string;
}

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Desk lamp', stock: 'in-stock', price: '$34' },
  { id: 'p2', name: 'Standing desk', stock: 'low', price: '$420' },
  { id: 'p3', name: 'Monitor arm', stock: 'in-stock', price: '$89' },
  { id: 'p4', name: 'Ergonomic chair', stock: 'out', price: '$310' },
  { id: 'p5', name: 'Cable tray', stock: 'in-stock', price: '$18' },
  { id: 'p6', name: 'Desk mat', stock: 'low', price: '$27' },
];
