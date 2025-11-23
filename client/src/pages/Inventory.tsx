import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Inventory() {
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.getAll,
  });

  if (isLoading) {
    return <div className="text-white">Loading inventory...</div>;
  }

  const lowStockItems = inventory.filter(item => item.status === 'Low Stock');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Inventory & Tools</h1>
          <p className="text-muted-foreground">Track equipment and stock levels</p>
        </div>
        <Button className="bg-primary text-black hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search inventory..." className="pl-9 bg-card/50 border-border/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const stockPercentage = item.minStockLevel ? (item.quantity / item.minStockLevel) * 50 : 75;
          
          return (
            <Card key={item.id} className="bg-card/40 border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    item.status === 'Low Stock' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : 
                    item.status === 'Out of Stock' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                    'text-green-500 border-green-500/30 bg-green-500/10'
                  }>
                    {item.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono font-bold text-white">{item.quantity} {item.unit}</span>
                  </div>
                  <Progress 
                    value={Math.min(stockPercentage, 100)} 
                    className="h-1.5" 
                    indicatorClassName={item.status === 'Low Stock' ? 'bg-amber-500' : 'bg-primary'} 
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-white/10 hover:bg-white/5">
                    <Minus className="h-3 w-3 mr-1" /> Use
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-white/10 hover:bg-white/5">
                    <Plus className="h-3 w-3 mr-1" /> Restock
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Low Stock Alert Card */}
        {lowStockItems.length > 0 && (
          <Card className="bg-amber-500/10 border-amber-500/30 border-dashed">
             <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-3">
               <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                 <AlertTriangle className="h-6 w-6 text-amber-500" />
               </div>
               <h3 className="font-bold text-amber-500">Low Stock Alert</h3>
               <p className="text-xs text-amber-200/70">
                 {lowStockItems.length} {lowStockItems.length === 1 ? 'item is' : 'items are'} below safety threshold. Please reorder soon.
               </p>
             </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
