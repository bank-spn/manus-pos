import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAppStore, useCartStore } from '@/lib/store';
import { Category, Product } from '@/lib/types';
import { Grid3x3, List, Minus, Plus, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  
  const { language } = useAppStore();
  const { items, addItem, getTotalItems } = useCartStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadData();
    
    // Subscribe to realtime updates
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'erp', table: 'products' }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, []);

  const loadData = async () => {
    await Promise.all([loadCategories(), loadProducts()]);
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.th.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name.en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getProductQtyInCart = (productId: number) => {
    return items.find(item => item.product.id === productId)?.qty || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {language === 'th' ? 'เมนู' : 'Menu'}
            </h1>
            <Button
              variant="default"
              size="lg"
              onClick={() => setLocation('/cart')}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {language === 'th' ? 'ตะกร้า' : 'Cart'}
              {getTotalItems() > 0 && (
                <Badge className="ml-2">{getTotalItems()}</Badge>
              )}
            </Button>
          </div>

          {/* Search and View Mode */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'th' ? 'ค้นหาเมนู...' : 'Search menu...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
          >
            {language === 'th' ? 'ทั้งหมด' : 'All'}
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name[language]}
            </Button>
          ))}
        </div>

        {/* Products */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const qtyInCart = getProductQtyInCart(product.id);
              return (
                <Card key={product.id} className="overflow-hidden">
                  {product.image_url && (
                    <div className="aspect-square bg-muted">
                      <img
                        src={product.image_url}
                        alt={product.name[language]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{product.name[language]}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {product.description[language]}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">฿{product.price.toFixed(2)}</span>
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold">{qtyInCart}</span>
                          <Button
                            size="icon"
                            variant="default"
                            className="h-8 w-8"
                            onClick={() => addItem(product)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addItem(product)}>
                          <Plus className="w-4 h-4 mr-1" />
                          {language === 'th' ? 'เพิ่ม' : 'Add'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const qtyInCart = getProductQtyInCart(product.id);
              return (
                <Card key={product.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {product.image_url && (
                      <div className="w-20 h-20 rounded bg-muted flex-shrink-0">
                        <img
                          src={product.image_url}
                          alt={product.name[language]}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{product.name[language]}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description[language]}
                        </p>
                      )}
                      <div className="font-bold text-lg mt-1">฿{product.price.toFixed(2)}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold w-8 text-center">{qtyInCart}</span>
                          <Button
                            size="icon"
                            variant="default"
                            className="h-8 w-8"
                            onClick={() => addItem(product)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => addItem(product)}>
                          <Plus className="w-4 h-4 mr-1" />
                          {language === 'th' ? 'เพิ่ม' : 'Add'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'th' ? 'ไม่พบเมนู' : 'No menu items found'}
          </div>
        )}
      </div>
    </div>
  );
}

