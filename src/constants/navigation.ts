// Navigation configuration for Self Aura Management App Shell
//
// Every nav item declares the backend permission key(s) that a user must hold
// to see it. The sidebar filters items with the AuthProvider `canAccess`
// snapshot (UX-only). The backend is the authorization source of truth - a
// stale snapshot (e.g. a permission revoked mid-session) surfaces as a 403
// "Access denied" on the page, never an automatic logout.
import {
  LayoutDashboard,
  Package,
  Boxes,
  Archive,
  Star,
  Users,
  ShoppingCart,
  RotateCcw,
  Truck,
  ShoppingBag,
  FileText,
  CreditCard,
  BookOpen,
  BarChart3,
  Truck as DeliveryTruck,
  Ship,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Shield,
  KeyRound,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: NavItem[];
  badge?: string;
  /** Permission key(s) required to see this item. Omit to always show. */
  permission?: string | string[];
}

export interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    groupLabel: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: "reports.dashboard",
      },
    ],
  },
  {
    groupLabel: "Catalog",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Package,
        permission: "products.view",
      },
      {
        label: "Categories",
        href: "/categories",
        icon: Boxes,
        permission: "categories.view",
      },
      {
        label: "Inventory",
        href: "/inventory",
        icon: Archive,
        permission: "inventory.view",
      },
      {
        label: "Reviews",
        href: "/reviews",
        icon: Star,
        permission: "reviews.view",
      },
    ],
  },
  {
    groupLabel: "Sales",
    items: [
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
        permission: "customers.view",
      },
      {
        label: "Orders",
        href: "/orders",
        icon: ShoppingCart,
        permission: "orders.view",
      },
      {
        label: "Returns",
        href: "/returns",
        icon: RotateCcw,
        permission: "returns.view",
      },
    ],
  },
  {
    groupLabel: "Procurement",
    items: [
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        permission: "suppliers.view",
      },
      {
        label: "Purchases",
        href: "/purchases",
        icon: ShoppingBag,
        permission: "purchases.view",
      },
    ],
  },
  {
    groupLabel: "Finance",
    items: [
      {
        label: "Expenses",
        href: "/expenses",
        icon: FileText,
        permission: "expenses.view",
      },
      {
        label: "Payments",
        href: "/payments",
        icon: CreditCard,
        permission: "payments.view",
      },
      {
        label: "Ledger",
        href: "/ledger",
        icon: BookOpen,
        permission: "payments.view",
      },
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        permission: [
          "reports.sales",
          "reports.purchases",
          "reports.expenses",
          "reports.payments",
          "reports.profitLoss",
          "reports.inventory",
          "reports.customers",
          "reports.returns",
          "reports.delivery",
          "reports.products",
          "reports.categories",
          "reports.dailySummary",
          "reports.dashboard",
        ],
      },
    ],
  },
  {
    groupLabel: "Delivery",
    items: [
      {
        label: "Couriers",
        href: "/couriers",
        icon: DeliveryTruck,
        permission: "couriers.view",
      },
      {
        label: "Shipments",
        href: "/shipments",
        icon: Ship,
        permission: "shipments.view",
      },
    ],
  },
  {
    groupLabel: "System",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: UserCog,
        permission: "users.view",
      },
      {
        label: "Roles",
        href: "/roles",
        icon: Shield,
        permission: "roles.view",
      },
      {
        label: "Permissions",
        href: "/permissions",
        icon: KeyRound,
        permission: "permissions.view",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        permission: "settings.view",
      },
    ],
  },
];

// Sidebar icons for collapse/expand
export const sidebarIcons = {
  menu: Menu,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  settings: Settings,
};

// Helper to flatten all navigation items for active route matching
export function getAllNavItems(): NavItem[] {
  return navigationConfig.flatMap((group) => group.items);
}

// Helper to find a nav item by href
export function findNavItemByHref(href: string): NavItem | undefined {
  return getAllNavItems().find((item) => item.href === href);
}

/** True when the item has no permission requirement or any declared one matches. */
export function canAccessNavItem(
  item: NavItem,
  canAccess: (permission: string) => boolean
): boolean {
  if (!item.permission) return true;
  const keys = Array.isArray(item.permission) ? item.permission : [item.permission];
  return keys.some((key) => canAccess(key));
}

/** First reachable nav destination, used by "Access denied" fallbacks. */
export function getFirstAccessibleNavPath(canAccess: (permission: string) => boolean): string {
  for (const group of navigationConfig) {
    for (const item of group.items) {
      if (canAccessNavItem(item, canAccess)) return item.href;
    }
  }
  return "/dashboard";
}

// Helper to check if a route is active or is a parent of the current route
export function isRouteActive(currentPath: string, itemHref: string): boolean {
  if (itemHref === "/dashboard") {
    return currentPath === "/dashboard";
  }
  return currentPath === itemHref || currentPath.startsWith(itemHref + "/");
}