// Low Stock Products component
// The backend has no per-product "unit" concept, so the table only shows the
// fields the low-stock endpoint actually provides.

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber } from '@/lib/currency';
import { AlertTriangle, Package, AlertCircle } from 'lucide-react';
import type { LowStockProduct } from '../types';

interface LowStockProductsProps {
  products: LowStockProduct[];
  isLoading: boolean;
}

export function LowStockProducts({ products, isLoading }: LowStockProductsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Low Stock Products</CardTitle>
            <AlertCircle className="h-5 w-5 animate-pulse text-warning" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!products.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Low Stock Products</CardTitle>
            <Badge variant="success">All stocked</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No low stock products"
            description="All products are well stocked."
            icon={<Package className="h-12 w-12 text-success" />}
          />
        </CardContent>
      </Card>
    );
  }

  const getStockStatus = (current: number, min: number) => {
    if (current <= 0) return { label: 'Out of Stock', variant: 'destructive' as const, icon: <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> };
    if (current <= min) return { label: 'Low Stock', variant: 'warning' as const, icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> };
    return { label: 'OK', variant: 'success' as const, icon: null };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Low Stock Products</CardTitle>
          <Badge variant={products.some((p) => p.currentStock <= 0) ? 'destructive' : 'warning'}>
            {products.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>Products below minimum stock level</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Min Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const status = getStockStatus(product.currentStock, product.minStockLevel);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(product.currentStock)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(product.minStockLevel)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}