import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Order, OrderItem } from '@/lib/types';
import { ArrowLeft, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useAppStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadOrders();

    // Subscribe to realtime updates
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'pos', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      // Get today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get order items for each order
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(o => o.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Combine orders with items
        const ordersWithItems = ordersData.map(order => ({
          ...order,
          order_items: itemsData?.filter(item => item.order_id === order.id) || [],
        }));

        setOrders(ordersWithItems);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<Order['status'], { variant: any; label: { th: string; en: string } }> = {
      pending: { variant: 'secondary', label: { th: 'รอดำเนินการ', en: 'Pending' } },
      confirmed: { variant: 'default', label: { th: 'ยืนยันแล้ว', en: 'Confirmed' } },
      preparing: { variant: 'default', label: { th: 'กำลังเตรียม', en: 'Preparing' } },
      ready: { variant: 'default', label: { th: 'พร้อมเสิร์ฟ', en: 'Ready' } },
      completed: { variant: 'default', label: { th: 'เสร็จสิ้น', en: 'Completed' } },
      cancelled: { variant: 'destructive', label: { th: 'ยกเลิก', en: 'Cancelled' } },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant}>
        {config.label[language]}
      </Badge>
    );
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/menu')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">
              {language === 'th' ? 'ประวัติออเดอร์' : 'Order History'}
            </h1>
          </div>
        </div>
      </div>

      <div className="container py-6 max-w-4xl">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {language === 'th' ? 'ไม่มีออเดอร์วันนี้' : 'No orders today'}
            </p>
            <Button onClick={() => setLocation('/menu')}>
              {language === 'th' ? 'เริ่มรับออเดอร์' : 'Start Taking Orders'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{order.order_number}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.created_at).toLocaleString(language === 'th' ? 'th-TH' : 'en-US')}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Order Items */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name[language]} × {item.qty}
                        </span>
                        <span>฿{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'th' ? 'ยอดรวม' : 'Subtotal'}</span>
                    <span>฿{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{language === 'th' ? 'ส่วนลด' : 'Discount'}</span>
                      <span>-฿{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>{language === 'th' ? 'ภาษี' : 'Tax'}</span>
                    <span>฿{order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>{language === 'th' ? 'ยอดชำระ' : 'Total'}</span>
                    <span>฿{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

