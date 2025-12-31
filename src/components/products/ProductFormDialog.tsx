import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/products/ImageUploader";
import { Product, Brand, Category } from "@/types/product";
import { isValidPrice, isValidStock } from "@/utils/validation";
import { useToast } from "@/hooks/use-toast";

interface ProductFormDialogProps {
  open: boolean;
  product: Product | null;
  brands: Brand[];
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const ProductFormDialog = ({
  open,
  product,
  brands,
  categories,
  onClose,
  onSubmit,
}: ProductFormDialogProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    actual_price: "",
    selling_price: "",
    discount: "",
    stock: "",
    category: "",
    brand: "",
    status: "active",
    keywords: "",
    description: "",
    allow_user_images: false,
    allow_user_description: false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        actual_price: product.actual_price?.toString() || "",
        selling_price: product.selling_price?.toString() || "",
        discount: product.discount?.toString() || "",
        stock: product.stock?.toString() || "",
        category: product.category || "",
        brand: product.brand || "",
        status: product.status || "active",
        keywords: product.keywords?.join(', ') || "",
        description: product.description || "",
        allow_user_images: product.allow_user_images || false,
        allow_user_description: product.allow_user_description || false,
      });
      setImages([]);
    } else {
      setFormData({
        name: "",
        actual_price: "",
        selling_price: "",
        discount: "",
        stock: "",
        category: "",
        brand: "",
        status: "active",
        keywords: "",
        description: "",
        allow_user_images: false,
        allow_user_description: false,
      });
      setImages([]);
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidPrice(formData.selling_price)) {
      toast({ title: "Invalid Price", variant: "destructive" });
      return;
    }

    if (!isValidStock(formData.stock)) {
      toast({ title: "Invalid Stock", variant: "destructive" });
      return;
    }

    const data = {
      name: formData.name,
      actual_price: formData.actual_price ? parseFloat(formData.actual_price) : null,
      selling_price: parseFloat(formData.selling_price),
      discount: ((parseFloat(formData.actual_price) - parseFloat(formData.selling_price)) / parseFloat(formData.actual_price)) * 100,
      stock: parseInt(formData.stock),
      category: formData.category,
      brand: formData.brand,
      status: formData.status,
      description: formData.description,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
      allow_user_images: formData.allow_user_images,
      allow_user_description: formData.allow_user_description,
      ...(images.length > 0 && { images }),
    };

    if (product) {
      onSubmit({ id: product.id, ...data });
    } else {
      onSubmit(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update product information' : 'Fill in the details to create a new product'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual_price">Actual Price (MRP) (₹)</Label>
              <Input
                id="actual_price"
                type="number"
                step="0.01"
                value={formData.actual_price}
                onChange={(e) => setFormData({ ...formData, actual_price: e.target.value })}
                placeholder="Original price"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if no discount
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Discount</Label>
              <div className="h-10 flex items-center">
                {formData.actual_price && formData.selling_price && parseFloat(formData.actual_price) > parseFloat(formData.selling_price) ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round(((parseFloat(formData.actual_price) - parseFloat(formData.selling_price)) / parseFloat(formData.actual_price)) * 100)}%
                    </span>
                    <span className="text-sm text-muted-foreground">OFF</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No discount</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => setFormData({ ...formData, brand: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ImageUploader
            images={images}
            onChange={setImages}
            maxImages={10}
            existingImages={product?.images}
          />

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              placeholder="smartphone, electronics, mobile..."
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter product description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          {/* ✅ NEW: User Interaction Toggles */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Customer Interaction Options</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to contribute content for this product
              </p>
            </div>

            <div className="flex items-center justify-between space-x-4 p-3 bg-background rounded-md">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="allow-images" className="font-medium">
                  Allow Customer Images
                </Label>
                <p className="text-sm text-muted-foreground">
                  Let customers upload product photos from their device
                </p>
              </div>
              <Switch
                id="allow-images"
                checked={formData.allow_user_images}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, allow_user_images: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-4 p-3 bg-background rounded-md">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="allow-description" className="font-medium">
                  Allow Customer Reviews
                </Label>
                <p className="text-sm text-muted-foreground">
                  Let customers add their own product reviews and feedback
                </p>
              </div>
              <Switch
                id="allow-description"
                checked={formData.allow_user_description}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, allow_user_description: checked })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};