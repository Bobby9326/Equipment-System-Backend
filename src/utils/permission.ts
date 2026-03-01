export const isAdminOrManager = (user: { role: string; departmentId: number | null }) =>
  user.role === 'admin' || user.departmentId === 1;

export const getDepartmentFilter = (user: { role: string; departmentId: number | null }, queryDepartmentId?: string) => {
  if (isAdminOrManager(user)) {
    return queryDepartmentId ? parseInt(queryDepartmentId) : undefined;
  }
  return user.departmentId ?? undefined;
};