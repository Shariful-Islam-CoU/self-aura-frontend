$basePath = "I:\Self Aura\self_aura_frontend"

$dirs = @(
    "src/app/(auth)/login",
    "src/app/(dashboard)/dashboard",
    "src/components/ui",
    "src/components/layout",
    "src/components/forms",
    "src/components/tables",
    "src/components/feedback",
    "src/components/charts",
    "src/features/auth",
    "src/features/dashboard",
    "src/features/categories",
    "src/features/products",
    "src/features/inventory",
    "src/features/customers",
    "src/features/orders",
    "src/features/suppliers",
    "src/features/purchases",
    "src/features/expenses",
    "src/features/payments",
    "src/features/returns",
    "src/features/couriers",
    "src/features/shipments",
    "src/features/reports",
    "src/features/settings",
    "src/lib/api",
    "src/lib/auth",
    "src/lib/config",
    "src/lib/utils",
    "src/services",
    "src/hooks",
    "src/types",
    "src/constants",
    "src/providers",
    "public/images",
    "public/icons"
)

foreach ($dir in $dirs) {
    $fullPath = Join-Path $basePath $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "Created: $dir"
    } else {
        Write-Host "Exists: $dir"
    }
}

Write-Host "All directories created!"