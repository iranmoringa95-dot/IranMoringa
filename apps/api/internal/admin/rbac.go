package admin

type Permission string

const (
	PermissionCatalogRead     Permission = "catalog.read"
	PermissionCatalogWrite    Permission = "catalog.write"
	PermissionOrdersRead      Permission = "orders.read"
	PermissionOrdersFulfill   Permission = "orders.fulfill"
	PermissionInventoryAdjust Permission = "inventory.adjust"
	PermissionAuditRead       Permission = "audit.read"
	PermissionUsersManage     Permission = "users.manage"
)

type Role string

const (
	RoleSuperAdmin     Role = "super_admin"
	RoleCatalogManager Role = "catalog_manager"
	RoleOrderOperator  Role = "order_operator"
	RoleSupportAgent   Role = "support_agent"
)

var rolePermissions = map[Role][]Permission{
	RoleSuperAdmin: {
		PermissionCatalogRead,
		PermissionCatalogWrite,
		PermissionOrdersRead,
		PermissionOrdersFulfill,
		PermissionInventoryAdjust,
		PermissionAuditRead,
		PermissionUsersManage,
	},
	RoleCatalogManager: {
		PermissionCatalogRead,
		PermissionCatalogWrite,
	},
	RoleOrderOperator: {
		PermissionOrdersRead,
		PermissionOrdersFulfill,
		PermissionInventoryAdjust,
	},
	RoleSupportAgent: {
		PermissionOrdersRead,
		PermissionCatalogRead,
	},
}

// HasPermission evaluates if a role possesses the specified permission.
func HasPermission(role Role, perm Permission) bool {
	permissions, exists := rolePermissions[role]
	if !exists {
		return false
	}
	for _, p := range permissions {
		if p == perm {
			return true
		}
	}
	return false
}
