import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EDGE_FUNCTIONS } from '@/lib/supabase';
import { useAppStore, useCartStore } from '@/lib/store';
import { ArrowLeft, CreditCard, DollarSign, Minus, Plus, QrCode, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function Cart() {
  const { items, updateQty, removeItem, clearCart, getSubtotal } = useCartStore();
  const { language, selectedTable } = useAppStore();
  const [, setLocation] = useLocation();
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr' | 'transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [processing, setProcessing] = useState(false);

  const subtotal = getSubtotal();
  const discountAmount = parseFloat(discount) || 0;
  const taxRate = 0.07;
  const tax = (subtotal - discountAmount) * taxRate;
  const total = subtotal - discountAmount + tax;

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error(language === 'th' ? 'ตะกร้าว่าง' : 'Cart is empty');
      return;
    }

    const amount = parseFloat(paymentAmount) || total;
    if (amount < total) {
      toast.error(language === 'th' ? 'จำนวนเงินไม่เพียงพอ' : 'Insufficient payment amount');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        table_id: selectedTable,
        items: items.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          qty: item.qty,
          price: item.product.price,
        })),
        payment_method: paymentMethod,
        payment_amount: amount,
        discount: discountAmount,
        tax_rate: taxRate,
      };

      const response = await fetch(EDGE_FUNCTIONS.posCheckout, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Checkout failed');
      }

      toast.success(
        language === 'th' 
          ? `ชำระเงินสำเร็จ! ออเดอร์: ${result.order.order_number}` 
          : `Payment successful! Order: ${result.order.order_number}`
      );

      clearCart();
      setShowCheckout(false);
      setLocation('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(
        language === 'th' 
          ? `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}` 
          : `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setProcessing(false);
    }
  };

  const change = (parseFloat(paymentAmount) || 0) - total;

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
              {language === 'th' ? 'ตะกร้าสินค้า' : 'Shopping Cart'}
            </h1>
          </div>
        </div>
      </div>

      <div className="container py-6 max-w-4xl">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {language === 'th' ? 'ตะกร้าว่าง' : 'Cart is empty'}
            </p>
            <Button onClick={() => setLocation('/menu')}>
              {language === 'th' ? 'เลือกเมนู' : 'Browse Menu'}
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <Card key={item.product.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {item.product.image_url && (
                      <div className="w-16 h-16 rounded bg-muted flex-shrink-0">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name[language]}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{item.product.name[language]}</h3>
                      <div className="text-sm text-muted-foreground">
                        ฿{item.product.price.toFixed(2)} × {item.qty}
                      </div>
                      <div className="font-bold mt-1">
                        ฿{(item.product.price * item.qty).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.product.id, item.qty - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold w-8 text-center">{item.qty}</span>
                      <Button
                        size="icon"
                        variant="default"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.product.id, item.qty + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 ml-2"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="p-6 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{language === 'th' ? 'ยอดรวม' : 'Subtotal'}</span>
                  <span>฿{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{language === 'th' ? 'ส่วนลด' : 'Discount'}</span>
                  <span>-฿{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{language === 'th' ? 'ภาษี (7%)' : 'Tax (7%)'}</span>
                  <span>฿{tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>{language === 'th' ? 'ยอดชำระ' : 'Total'}</span>
                  <span>฿{total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => clearCart()} className="flex-1">
                {language === 'th' ? 'ล้างตะกร้า' : 'Clear Cart'}
              </Button>
              <Button onClick={() => setShowCheckout(true)} className="flex-1" size="lg">
                {language === 'th' ? 'ชำระเงิน' : 'Checkout'}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'th' ? 'ชำระเงิน' : 'Checkout'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Method */}
            <div>
              <Label>{language === 'th' ? 'วิธีชำระเงิน' : 'Payment Method'}</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="w-4 h-4" />
                    {language === 'th' ? 'เงินสด' : 'Cash'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    {language === 'th' ? 'บัตรเครดิต' : 'Credit Card'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qr" id="qr" />
                  <Label htmlFor="qr" className="flex items-center gap-2 cursor-pointer">
                    <QrCode className="w-4 h-4" />
                    {language === 'th' ? 'QR Code' : 'QR Code'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Discount */}
            <div>
              <Label htmlFor="discount">{language === 'th' ? 'ส่วนลด' : 'Discount'}</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Payment Amount */}
            <div>
              <Label htmlFor="amount">{language === 'th' ? 'จำนวนเงินที่รับ' : 'Amount Received'}</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={total.toFixed(2)}
              />
            </div>

            {/* Total */}
            <Card className="p-4 bg-muted">
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>{language === 'th' ? 'ยอดชำระ' : 'Total'}</span>
                  <span>฿{total.toFixed(2)}</span>
                </div>
                {change > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{language === 'th' ? 'เงินทอน' : 'Change'}</span>
                    <span>฿{change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1" disabled={processing}>
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button onClick={handleCheckout} className="flex-1" disabled={processing}>
                {processing 
                  ? (language === 'th' ? 'กำลังดำเนินการ...' : 'Processing...') 
                  : (language === 'th' ? 'ยืนยัน' : 'Confirm')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

