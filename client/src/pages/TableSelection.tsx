import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Table } from '@/lib/types';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export default function TableSelection() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, setSelectedTable } = useAppStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('is_active', true)
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (tableId: number) => {
    setSelectedTable(tableId);
    setLocation('/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {language === 'th' ? 'เลือกโต๊ะ' : 'Select Table'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'th' ? 'กรุณาเลือกโต๊ะเพื่อเริ่มรับออเดอร์' : 'Please select a table to start taking orders'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSelectTable(table.id)}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{table.table_number}</div>
                  {table.name && (
                    <div className="text-sm text-muted-foreground">
                      {table.name[language]}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {language === 'th' ? `${table.capacity} ที่นั่ง` : `${table.capacity} seats`}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              setSelectedTable(undefined);
              setLocation('/menu');
            }}
          >
            {language === 'th' ? 'ไม่ระบุโต๊ะ (Take Away)' : 'No Table (Take Away)'}
          </Button>
        </div>
      </div>
    </div>
  );
}

