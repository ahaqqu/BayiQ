# Glossary

Shared domain language for BayiQ. Every noun and verb in the implementation must map to one of these terms.

---

### Account

**Type:** aggregate  
**Context:** identity  
**Definition:** The parent or caregiver who owns the app data. Currently represented by an anonymous D1 session; future versions may upgrade to real OAuth/email identity.  
**Also known as:** *user*, *parent* (informal only)

---

### Child

**Type:** entity  
**Context:** immunization tracking  
**Definition:** A person whose immunization schedule is being tracked. Belongs to exactly one Account. Identified by `childId`.  
**Also known as:** *patient*, *kid*

---

### Dose

**Type:** value object  
**Context:** immunization schedule  
**Definition:** A single scheduled administration of a Vaccine at a specific age in months. Identified by a stable `doseId` (e.g. `dpt-2mo`). The same logical Dose is identical for every Child.  
**Also known as:** *shot*, *instance*

---

### DoseId

**Type:** value object  
**Context:** immunization schedule / records  
**Definition:** A stable, human-readable identifier for a canonical Dose. Records reference `doseId` instead of vaccine + months so the schedule can be updated without breaking existing records.  
**Also known as:** *vaccineId:months* (rejected — brittle)

---

### Record

**Type:** entity  
**Context:** immunization tracking  
**Definition:** Proof that a specific Dose was given to a specific Child on a given date, including optional brand/type and note. Identified by `recordId`.  
**Also known as:** *entry*, *log*

---

### Schedule

**Type:** value object  
**Context:** immunization schedule  
**Definition:** The complete IDAI 2024 reference table: 18 Vaccines, 26 age columns, and the canonical Doses at each intersection. Static application configuration, not user data.  
**Also known as:** *jadwal*

---

### Session

**Type:** entity  
**Context:** identity  
**Definition:** An anonymous Bearer token stored in D1 that identifies the current Account on this device. Created on first app launch / one-tap continue.  
**Also known as:** *auth token*, *login*

---

### Status

**Type:** value object  
**Context:** immunization tracking  
**Definition:** The computed state of a Dose for a Child at the current date: `done`, `due`, `overdue`, or `upcoming`. Derived from the Child’s date of birth, the Dose’s scheduled months, an optional Record, and a grace window.  
**Also known as:** *state*

---

### Vaccine

**Type:** value object  
**Context:** immunization schedule  
**Definition:** A preventable disease target with a canonical ID, bilingual name, color, and an ordered list of Doses. Part of the static Schedule.  
**Also known as:** *vaksin*

---

## Verbs

### Add Child

**Type:** command  
**Context:** immunization tracking  
**Definition:** Create a new Child under the current Account.

### Record Dose

**Type:** command  
**Context:** immunization tracking  
**Definition:** Create or update a Record for a specific Dose and Child.

### Switch View

**Type:** command  
**Context:** UI  
**Definition:** Toggle between the dense schedule table and the list/card view on the schedule screen.

### Sync

**Type:** command  
**Context:** local-first  
**Definition:** Opportunistically push/pull Account-owned CRDT data between the client store and the D1-backed server.
