export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[^\d]/g, ''));
  };
  
  export const isValidPrice = (price: string | number): boolean => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return !isNaN(numPrice) && numPrice >= 0;
  };
  
  export const isValidStock = (stock: string | number): boolean => {
    const numStock = typeof stock === 'string' ? parseInt(stock) : stock;
    return Number.isInteger(numStock) && numStock >= 0;
  };
  
  export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'Image must be less than 5MB' };
    }
    
    return { valid: true };
  };
  
  export const isValidCouponCode = (code: string): boolean => {
    const couponRegex = /^[A-Z0-9]{4,20}$/;
    return couponRegex.test(code);
  };