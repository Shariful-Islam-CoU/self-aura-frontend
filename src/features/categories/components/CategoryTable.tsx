"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/LoadingState";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { ProductImageFrame } from "@/components/media";
import { MoreHorizontal, Pencil, Power } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { resolveCategoryThumbnailUrl } from "../lib/media";
import type { Category } from "../types";

interface CategoryTableProps {
  categories: Category[];
  canManage: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryTable({
  categories,
  canManage,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>Product categories</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Thumbnail</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              {/*
                The thumbnail is shown in the list so a staff member can see what
                a category looks like on the storefront without opening each one.
                `ProductImageFrame` renders the shared styled placeholder when
                there is no thumbnail, so the column never shows a broken image
                and never shifts the row height.
              */}
              <TableCell>
                <ProductImageFrame
                  src={resolveCategoryThumbnailUrl(category.thumbnail)}
                  alt={category.thumbnail?.alt || `${category.name} category`}
                  sizes="48px"
                  aspectRatio="1 / 1"
                  className="w-12"
                  fallbackLabel="No thumbnail"
                />
              </TableCell>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {category.description || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={category.isActive ? "success" : "secondary"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(category.createdAt)}
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${category.name}`}>
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(category)}>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(category)}>
                        <Power className="mr-2 h-4 w-4" aria-hidden="true" />
                        {category.isActive ? "Deactivate" : "Reactivate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CategoryTableSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-9 rounded-md border border-border" />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}