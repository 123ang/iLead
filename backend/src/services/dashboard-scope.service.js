/** Prisma WhereInput fragments for dashboards & ROI scoped by JWT user */

export function isGlobalDashboardRole(role) {
  return ["SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN", "REGISTRAR", "FINANCE"].includes(
    role ?? "",
  );
}

export function scopedLeadWhere(user) {
  const base = { deletedAt: null };
  if (!user) return base;
  if (isGlobalDashboardRole(user.role)) return base;

  if (user.role === "STAFF") {
    return { ...base, assignedStaffId: user.id };
  }

  const fid = user.facultyId;
  if (
    fid &&
    (user.role === "FACULTY_DEAN" || user.role === "PROGRAMME_COORDINATOR")
  ) {
    return {
      ...base,
      OR: [
        { interestedProgramme: { facultyId: fid } },
        {
          touches: {
            some: {
              campaign: {
                OR: [
                  { faculties: { some: { facultyId: fid } } },
                  {
                    programmes: {
                      some: { programme: { facultyId: fid } },
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    };
  }

  return base;
}

/** Campaign visibility for KPI count */
export function scopedCampaignWhere(user) {
  const base = { deletedAt: null };
  if (!user) return base;
  if (isGlobalDashboardRole(user.role)) return base;

  if (user.role === "STAFF") {
    return {
      ...base,
      leadTouches: {
        some: { lead: { deletedAt: null, assignedStaffId: user.id } },
      },
    };
  }

  const fid = user.facultyId;
  if (
    fid &&
    (user.role === "FACULTY_DEAN" || user.role === "PROGRAMME_COORDINATOR")
  ) {
    return {
      ...base,
      OR: [
        { faculties: { some: { facultyId: fid } } },
        {
          programmes: { some: { programme: { facultyId: fid } } },
        },
      ],
    };
  }

  return base;
}
