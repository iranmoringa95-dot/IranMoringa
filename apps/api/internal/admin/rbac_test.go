package admin

import "testing"

func TestHasPermission(t *testing.T) {
	// Super Admin
	if !HasPermission(RoleSuperAdmin, PermissionAuditRead) {
		t.Errorf("expected SuperAdmin to have AuditRead permission")
	}

	// Catalog Manager
	if !HasPermission(RoleCatalogManager, PermissionCatalogWrite) {
		t.Errorf("expected CatalogManager to have CatalogWrite permission")
	}
	if HasPermission(RoleCatalogManager, PermissionAuditRead) {
		t.Errorf("expected CatalogManager NOT to have AuditRead permission")
	}

	// Order Operator
	if !HasPermission(RoleOrderOperator, PermissionOrdersFulfill) {
		t.Errorf("expected OrderOperator to have OrdersFulfill permission")
	}
	if HasPermission(RoleOrderOperator, PermissionUsersManage) {
		t.Errorf("expected OrderOperator NOT to have UsersManage permission")
	}

	// Unknown Role
	if HasPermission("unknown_role", PermissionCatalogRead) {
		t.Errorf("expected unknown role to have 0 permissions")
	}
}
