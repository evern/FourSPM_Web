# Dependencies for Creating SQL Insert Statements for Deliverables

This document outlines all required dependencies and conventions for generating SQL insert statements for the `DELIVERABLE` table in the FourSPM database.

---

## 1. Project and Client Context
- **Project Guid:** e.g. `DEF5B1AA-4C90-40FD-A6E9-04D866C18B7E`
- **Client Number:** e.g. `025`
- **Project Number:** e.g. `11`
- **Project Name:** e.g. `Aircraft Component Testing Facility`

---

## 2. Table Schema: DELIVERABLE
The main required columns for inserts are:
- GUID (uniqueidentifier)
- GUID_PROJECT (uniqueidentifier)
- AREA_NUMBER (varchar(2))
- DISCIPLINE (nvarchar(2))
- DOCUMENT_TYPE (nvarchar(3))
- DEPARTMENT_ID (int)
- DELIVERABLE_TYPE_ID (int)
- INTERNAL_DOCUMENT_NUMBER (varchar(50))
- CLIENT_DOCUMENT_NUMBER (varchar(100))
- DOCUMENT_TITLE (nvarchar(255))
- BUDGET_HOURS (decimal)
- VARIATION_HOURS (decimal)
- BOOKING_CODE (varchar(50))
- TOTAL_COST (decimal)
- CREATED (datetime)
- CREATEDBY (uniqueidentifier)
- VARIATION_STATUS (int)

Other columns may be set to NULL/defaults as appropriate.

---

## 3. Area Table
| NUMBER | DESCRIPTION                         |
|--------|-------------------------------------|
| 6      | Electrical Systems Validation       |
| 4      | Environmental and Climate Chamber   |
| 5      | Materials Analysis and Testing      |
| 8      | Fuel System Components             |
| 1      | Structural Testing Lab              |
| 7      | Hydraulic and Pneumatic Systems     |
| 10     | Composite Materials and Structures  |
| 2      | Engine Component Testing            |
| 3      | Avionics and Electronic Systems     |
| 9      | Landing Gear Validation             |

---

## 4. Discipline Table
| CODE | NAME                |
|------|---------------------|
| PP   | Process Piping      |
| ME   | Mechanical          |
| GE   | General Engineering |
| ST   | Structural          |
| PR   | Process             |
| CC   | Civil Construction  |
| CI   | Civil               |

---

## 5. Document Type Table
| CODE | NAME                           |
|------|--------------------------------|
| REP  | Report                         |
| ISO  | Isometric Drawing              |
| REV  | Review Document                |
| PID  | Piping and Instrumentation Diagram |
| TBE  | Technical Basis Evaluation     |
| MDL  | Model                          |
| CAL  | Calculation                    |
| DCC  | Document Control Checklist     |
| MTG  | Meeting Minutes                |
| DWG  | Drawing                        |
| PFD  | Process Flow Diagram           |
| MAN  | Manual                         |

---

## 6. Enums
### DepartmentEnum
- 0: Administration
- 1: Design
- 2: Engineering
- 3: Management

### DeliverableTypeEnum
- 0: Task
- 1: NonDeliverable
- 2: DeliverableICR
- 3: Deliverable

---

## 7. Internal Document Number Convention
Format:
```
{clientNumber}-{projectNumber}-{Area}-{Discipline}-{Document Type}-{Iterations}
```
Example:
```
017-11-05-ME-MDL-001
```

---

## 8. Additional Notes
- All GUIDs must be unique (except for foreign keys).
- Use correct enum values for department and deliverable type.
- Ensure area, discipline, and document type codes match the lookup tables above.
- Set default values for required fields if not specified.
- For the CREATEDBY field, use the user GUID: `F4EBB817-B53A-493E-B59E-1B74228269D9`.
- Area numbers must be exactly two digits: `([AREA_NUMBER] like '[0-9][0-9]')`.
- For new deliverables, GUID_ORIGINAL_DELIVERABLE must always be set to the same value as GUID.

---

This document should be referenced whenever generating SQL insert statements for the DELIVERABLE table to ensure all dependencies are satisfied and conventions are followed.
