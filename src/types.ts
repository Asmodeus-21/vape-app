export interface Product {
  id: number;
  name: string;
  brand: string;
  flavor: string;
  nicotine: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  isExpressDelivery: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  description: string;
}

export interface User {
  id: string;
  role: 'customer' | 'vendor' | 'admin';
  email: string;
  ageVerified: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationMethod?: 'id_upload' | 'database_check' | 'manual';
}

export interface FlavorPreference {
  profile: string;
  nicotineLevel: string;
  deviceType: string;
}
