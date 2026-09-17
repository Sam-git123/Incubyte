# Product Requirements

## Product goal

ACME needs a web application that replaces the core salary-management work now performed in spreadsheets. Its primary user is an HR Manager who needs to find employee compensation quickly, make safe salary changes, and understand compensation patterns across an international workforce of approximately 10,000 employees.

Success means the HR Manager can complete those tasks efficiently with trustworthy data, without turning this assessment into a payroll engine or a general-purpose HR system.

## Requirements

### Employee directory and details

- Present employees in a structured table with employee ID, name, email, department, job title, country, current salary, and currency.
- Support server-side pagination, search by name or employee ID, filtering by country and department, and sorting by useful fields such as name and salary.
- Provide loading, empty, and error states; changing filters should reset pagination when appropriate.
- Allow an HR Manager to open an employee and see their profile, current salary, currency, effective date, and available salary history.

### Salary management

- Allow a salary change with a positive amount, valid ISO-4217 currency code, and valid effective date.
- Store money as integer minor units rather than floating-point values.
- Preserve prior salary records instead of destructively overwriting them; the latest applicable record represents current salary.
- Return understandable validation and not-found errors, prevent duplicate submissions, and refresh affected employee and analytics views after a successful change.

### Compensation insights

- Show headcount and salary statistics: average, median, minimum, and maximum.
- Provide useful breakdowns by department and country, with relevant filters.
- Keep calculations currency-correct: values in different currencies must not be combined as though they were directly comparable. Report by currency or another valid grouping until an explicit conversion policy exists.

### Data, quality, and operability

- Support exactly 10,000 deterministic seeded employees with believable countries, departments, roles, currencies, and salary bands.
- Validate all API input on the server, constrain pagination and sorting, avoid exposing stack traces, and avoid unnecessary salary logging.
- Use meaningful automated behavioural tests for salary rules, APIs, analytics, and critical UI workflows; keep tests deterministic and independent of external services.
- Make obvious scalable choices for this workload: bounded server-side pages, database-level filtering and aggregation, and debounced search.
- Provide accessible labels, keyboard-operable controls, semantic tables, visible validation, appropriate focus handling, and reasonable contrast.

## Assumptions

- The first version serves one trusted HR Manager persona; identity and permissions are deferred, not considered unnecessary for production.
- Employee salary records use a single currency each, and currency is explicit on every salary record.
- Salary amounts fit safely in the chosen integer representation; supported currencies and minor-unit rules will be defined during domain design.
- An effective-dated salary record becomes current according to a rule to be specified and tested before implementation, including treatment of future-dated changes and ties.
- The assessment workload is modest enough for a single application instance and relational database during development and review.
- Seed data is synthetic and is not intended to model real-world compensation perfectly.

## Deliberately excluded from the first version

- Authentication and advanced role-based access control.
- Payroll processing, payments, taxes, deductions, benefits, payslips, or bank integrations.
- Recruitment, onboarding, leave, attendance, performance reviews, employee documents, and notifications.
- Spreadsheet import unless explicitly prioritized after the primary requirements are complete.
- Live foreign-exchange integration or invented cross-currency totals.
- Microservices, event sourcing, CQRS, queues, Redis, Kubernetes, GraphQL, and other infrastructure without a demonstrated need.

Production use would additionally require strong authentication and authorization, encryption, privacy controls, audit logging, retention policies, and operational safeguards. Those needs should influence boundaries but are not Phase 0 implementation scope.
