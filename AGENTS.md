# AGENTS.md

# LMS Development Guidelines

## Project Overview

This is a Learning Management System (LMS) with role-based access control (RBAC). The backend is the source of truth for authorization. Never bypass role or hierarchy checks on the frontend.

---

# Roles

| Role ID | Role Name |
|---------:|-----------|
| 1 | Master Admin |
| 2 | Admin |
| 3 | Team Leader |
| 4 | Franchise Partner |
| 5 | Franchise Employee |
| 6 | Franchise Developer |
| 7 | Head Office Staff |

---

# Role Hierarchy

The organization follows these reporting structures.

## Administrative Hierarchy

```
Master Admin (1)
        │
Admin (2)
        │
 ┌──────┴──────────────┐
 │                     │
Team Leaders (3)   Head Office Staff (7)
 │
 ├── Franchise Partner (4)
 │      └── Franchise Employee (5)
 │
 └── Franchise Partner (4)
        └── Franchise Employee (5)
```

## Development Hierarchy

```
Master Admin (1)
        │
Admin (2)
        │
Franchise Developer (6)
        │
Franchise Partner (4)
        │
Franchise Employee (5)
```

---

# Authority Rules

## Master Admin (1)

- Full system access.
- Can manage every user.
- Can access all organizations, franchises, reports, and programs.
- Has unrestricted visibility.

## Admin (2)

- Same operational permissions as Master Admin unless explicitly restricted by business rules.
- Has unrestricted visibility.

---

# Learner Roles

The following roles are considered learners:

- Team Leader (3)
- Franchise Partner (4)
- Franchise Employee (5)
- Franchise Developer (6)
- Head Office Staff (7)

**Only roles 1 and 2 are administrative roles.**

---

# Reporting Relationships

A Team Leader manages multiple Franchise Partners.

A Franchise Partner manages multiple Franchise Employees. they are simply Franchise owners.

Head Office Staff report directly under Admin/Master Admin.

Franchise Developers operate under Admin/Master Admin and oversee Franchise Partners and their Franchise Employees.

---

# Authorization Rules

When implementing features:

- Never assume permissions based only on UI.
- Always validate permissions on the backend.
- Respect hierarchy when querying data.
- Users should only access data belonging to themselves or their descendants in the hierarchy unless they are Admin or Master Admin.

Examples:

- Team Leaders can access their own data and the data of Franchise Partners and Franchise Employees assigned to them.
- Franchise Partners can access only themselves and their Franchise Employees.
- Franchise Employees can access only their own data.
- Franchise Developers can access the Franchise Partners and Franchise Employees assigned within their scope.
- Head Office Staff can access only their own learner data unless explicitly granted additional permissions.
- Master Admin and Admin can access everything.

---

# Development Principles

- Backend authorization is the source of truth.
- Never duplicate authorization logic unnecessarily.
- Prefer reusable services over duplicated business logic.
- Keep role checks centralized whenever possible.
- Do not hardcode permissions in frontend components.
- Follow the existing RBAC model before introducing new roles or permissions.