import { Product } from '../types';

export const mockProducts: Product[] = [
  { 
    id: 1, 
    name: "VaporMax Elite Pro Mod - Carbon Fiber Edition", 
    brand: "TitanVape", 
    flavor: "N/A (Hardware)", 
    nicotine: "N/A", 
    price: 149.99, 
    rating: 4.9,
    reviews: 2450,
    image: "/images/devices/geekvape-aegis-legend.jpg", 
    category: "Mods",
    isExpressDelivery: true,
    isBestSeller: true,
    description: "The ultimate power for professional vapers. Featuring a dual-21700 battery configuration and the advanced Titan-X chipset."
  },
  { 
    id: 2, 
    name: "Geek Bar Pulse X 25000 Puffs - Clear", 
    brand: "Geek Bar", 
    flavor: "Clear", 
    nicotine: "5%", 
    price: 24.50, 
    rating: 4.6,
    reviews: 5102,
    image: "/images/geek-bar-pulse-x-25000-clear.jpg", 
    category: "Disposables",
    isExpressDelivery: true,
    isBestSeller: true,
    description: "The longest lasting disposable with a built-in LED screen for e-liquid and battery monitoring."
  },
  { 
    id: 3, 
    name: "Backwoods Cigars - Honey Berry", 
    brand: "Backwoods", 
    flavor: "Honey Berry", 
    nicotine: "Tobacco", 
    price: 9.99, 
    rating: 4.9,
    reviews: 1240,
    image: "/images/backwoods-honey-berry.jpg", 
    category: "Rolling",
    isExpressDelivery: true,
    isNewArrival: true,
    description: "Authentic rustic smoking experience."
  },
  { 
    id: 4, 
    name: "Puffco Pivot Portable Vaporizer", 
    brand: "Puffco", 
    flavor: "N/A (Hardware)", 
    nicotine: "N/A", 
    price: 189.00, 
    rating: 4.8,
    reviews: 3100,
    image: "/images/puffco-pivot-device.jpg", 
    category: "Devices",
    isExpressDelivery: true,
    isNewArrival: true,
    description: "Sleek, pocket-friendly, and powerful flavor extraction."
  },
  { 
    id: 5, 
    name: "SMOK RPM Series Replacement Coils", 
    brand: "SMOK", 
    flavor: "N/A", 
    nicotine: "N/A", 
    price: 18.99, 
    rating: 4.7,
    reviews: 890,
    image: "/images/accessories/smok-rpm-coils.jpeg", 
    category: "Accessories",
    isExpressDelivery: true,
    description: "High-performance mesh coils designed for maximum flavor clarity and longevity."
  },
  { 
    id: 6, 
    name: "JUUL Kit with Virginia Tobacco Pods", 
    brand: "JUUL", 
    flavor: "Virginia Tobacco", 
    nicotine: "5%", 
    price: 29.99, 
    rating: 4.5,
    reviews: 1820,
    image: "/images/juul-virginia-tobacco-pods.jpg", 
    category: "Pod Systems",
    isExpressDelivery: true,
    isBestSeller: true,
    description: "A smooth, familiar tobacco experience perfectly balanced."
  },
  { 
    id: 7, 
    name: "Cookies Premium Glass - Flame Beaker", 
    brand: "Cookies", 
    flavor: "N/A", 
    nicotine: "N/A", 
    price: 119.50, 
    rating: 4.7,
    reviews: 945,
    image: "/images/cookies-flame-beaker.JPG", 
    category: "Glass",
    isExpressDelivery: true,
    description: "Authentic Cookies branded glassware for the smoothest hits."
  },
  { 
    id: 8, 
    name: "Tyson 2.0 Gravity Bong", 
    brand: "Tyson", 
    flavor: "N/A", 
    nicotine: "N/A", 
    price: 499.00, 
    rating: 4.9,
    reviews: 320,
    image: "/images/tyson-gravity-bong-2.0.jpeg", 
    category: "Glass",
    isExpressDelivery: false,
    isNewArrival: true,
    description: "Premium kinetic motion gravity bong championed by Mike Tyson."
  }
];

export const fetchProducts = async (): Promise<Product[]> => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockProducts);
    }, 300);
  });
};
