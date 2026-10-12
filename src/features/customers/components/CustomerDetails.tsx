"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapPin, Phone, Mail, StickyNote, History, ArrowRight, User, Globe } from "lucide-react";
import { formatDateTime } from "@/lib/dateUtils";
import type { Customer, CustomerAddress } from "../types";

function AddressCard({ address }: { address: CustomerAddress }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{address.label}</span>
        {address.isDefault && <Badge variant="info">Default</Badge>}
      </div>
      <address className="mt-1 text-sm not-italic text-muted-foreground">
        {address.recipientName && <p className="font-medium text-foreground">{address.recipientName}</p>}
        <p>{address.addressLine}</p>
        {(address.area || address.city) && (
          <p>
            {[address.area, address.city].filter(Boolean).join(", ")}
          </p>
        )}
        {(address.postalCode || address.country) && (
          <p>
            {[address.postalCode, address.country].filter(Boolean).join(", ")}
          </p>
        )}
        {address.phone && <p>{address.phone}</p>}
      </address>
    </div>
  );
}

interface CustomerDetailsProps {
  open: boolean;
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetails({ open, customer, onOpenChange }: CustomerDetailsProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{customer.name}</DialogTitle>
            <Badge variant={customer.isActive ? "success" : "secondary"}>
              {customer.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <DialogDescription>Customer profile</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                <dd className="mt-0.5 text-sm text-foreground">{customer.phone}</dd>
              </div>
            </div>
            {customer.alternatePhone && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Alternate phone</dt>
                <dd className="mt-0.5 text-sm text-foreground">{customer.alternatePhone}</dd>
              </div>
            )}
            {customer.email && (
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{customer.email}</dd>
                </div>
              </div>
            )}
            {customer.facebookName && (
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Facebook Name</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{customer.facebookName}</dd>
                </div>
              </div>
            )}
            {customer.facebookProfileUrl && (
              <div className="flex items-start gap-2">
                <Globe className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Facebook Profile</dt>
                  <dd className="mt-0.5 text-sm text-foreground">
                    <a
                      href={customer.facebookProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {customer.facebookProfileUrl}
                    </a>
                  </dd>
                </div>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-0.5 text-sm text-foreground">
                {formatDateTime(customer.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last updated</dt>
              <dd className="mt-0.5 text-sm text-foreground">
                {formatDateTime(customer.updatedAt)}
              </dd>
            </div>
          </dl>

          {customer.addresses.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Addresses
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {customer.addresses.map((address) => (
                    <AddressCard key={address.id} address={address} />
                  ))}
                </div>
              </div>
            </>
          )}

          {customer.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {customer.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {customer.notes && (
            <div className="flex items-start gap-2">
              <StickyNote className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Notes</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {customer.notes}
                </p>
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h4 className="text-sm font-semibold text-foreground">Order history</h4>
            <div className="mt-3">
              <EmptyState
                title="No order history yet."
                description="Customer order history will appear here when the Orders module is available."
                icon={<History className="h-12 w-12" aria-hidden="true" />}
                action={
                  <Link
                    href="/orders"
                    className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Go to Orders
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Link>
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}