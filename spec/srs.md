# Software Requirements Specification (SRS)

**System Name:** Personal Media Content Tracking Information System  
**Document Version:** 1.3.0  
**Date:** September 25, 2026  
**Author:** Victoria Buksha  
**Document Type:** Software Requirements Specification

> This document was prepared using the SKED methodology (Socratic Knowledge Elicitation & Documentation) as part of the "Information Systems Design" course.

---

## Abstract

This document is a Software Requirements Specification (SRS) for the personal media content tracking web application covering books, TV series, and films. The system is intended for registered users who maintain a personal catalog of viewed and read content. The document defines functional requirements (30 requirements), non-functional requirements (9 requirements), acceptance criteria, BDD scenarios, and a traceability matrix for version v1 (MVP). The MVP includes: registration and authentication, a catalog with CRUD operations, tags with autocomplete, a Sessions mechanism for recording repeated viewings, collections (many-to-many), automatic completion date fill, and personal statistics. Social interaction features, offline mode, and integration with third-party media databases are deferred to future versions.

---

## 1. Introduction

### 1.1 Purpose and Scope of the Document

This document is a Software Requirements Specification (SRS) for the personal media content tracking information system. The purpose of this document is to formally describe the functional and non-functional requirements of the system, define the boundaries of version v1 (MVP), and provide a basis for software design documentation (SDD) and testing.

### 1.2 System Purpose

The system is a web application that allows a registered user to maintain a personal catalog of media content — books, TV series, and films. The application provides tracking of viewed and read content: recording statuses, ratings, notes, tags, repeated viewings (Sessions), organizing items into collections, and viewing personal statistics.

### 1.3 Document Context and Audience

This document was prepared as part of the "Information Systems Design" course (SDD cycle). Target audience: the course instructor and system developers. A reader of this document should obtain sufficient information to develop the system architecture and testing plan without additional clarification.

### 1.4 Document Structure

- Section 2 — general system description, MVP boundaries, user roles, operating environment.
- Section 3 — key term definitions.
- Section 4 — development methodology (SDD, TDD, traceability).
- Section 5 — complete list of functional requirements grouped by functional blocks.
- Section 6 — non-functional requirements: performance, security, reliability, usability, compatibility, validation.
- Section 7 — acceptance criteria for each requirement.
- Section 8 — BDD scenarios in Gherkin format.
- Section 9 — requirements traceability matrix.
- Appendix A — features outside the MVP scope.

---

## 2. General System Description

### 2.1 Product Overview and Perspective

The system is a standalone web application with no external service integrations within the MVP scope. Each registered user has their own isolated data space — a catalog, collections, and statistics. The system is not part of a larger platform and does not provide a public API in version v1.

### 2.2 Functional Blocks

The system implements the following functional blocks:

1. Authentication and account management.
2. Personal media content catalog.
3. Content item management (CRUD).
4. Tags and tag-based filtering.
5. Sessions — recording repeated viewings or readings.
6. Collections — custom named groups of items.
7. Automatic completion date fill.
8. Personal statistics.

### 2.3 User Roles

Version v1 has a single user role. No administrative role exists.

| Role | Description |
|---|---|
| User | Registered account owner. Has access exclusively to their own catalog, collections, and statistics. May perform all CRUD operations on their own data. |

### 2.4 Operating Environment

The system is implemented as a web application. A native mobile application is not planned for version v1. The system must function correctly in the latest two versions of Chrome, Firefox, Edge, and Safari browsers, including mobile Safari on iOS. The backend implementation language is not specified by this document and is determined at the architecture design stage.

### 2.5 Design and Implementation Constraints

- Implementation exclusively as a web application.
- Version v1 supports only one interface language.
- The system does not integrate with external media content databases (TMDB, Google Books, etc.).
- Each user has access exclusively to their own data; cross-user access is not provided.

### 2.6 MVP Boundaries — What Is Not Included in Version v1

The following features are technically feasible but deliberately excluded from the MVP to constrain the scope of the first release. A detailed list is provided in Appendix A.

---

## 3. Glossary

| Term | Ukrainian Equivalent | Definition |
|---|---|---|
| Catalog | Каталог | The complete list of all content items added by the user. |
| Content Item | Елемент контенту | A single entry in the catalog — a book, TV series, or film with its own attributes (type, status, rating, tags, etc.). |
| Collection | Добірка | A user-created named group of arbitrary catalog items; one item can belong to multiple collections simultaneously. |
| Session | Session | An individual record of a viewing or reading of an item; contains date, rating, and note; one item can have multiple Sessions. |
| Tag | Тег | An arbitrary text label that the user attaches to an item for categorization. |
| Status | Статус | The current state of work on an item: *planned / in progress / completed / on hold*. |

---

## 4. Development Methodology

### 4.1 Specification-Driven Development (SDD)

The system is developed in accordance with the Specification Driven Development (SDD) methodology. The specification is the controlling source of system behavior — no source code may define behavior independently of this document.

Required process for every behavioral change:

1. Update this document before making any code changes.
2. Assign or update a requirement identifier (REQ-F-NNN or REQ-NF-NNN).
3. Define an acceptance criterion (AC-NNN) for each requirement.
4. Write an automated test before implementation (TDD, Section 4.2).
5. Run the test and confirm it fails for the expected reason (Red).
6. Implement the minimal code that passes the test (Green).
7. Refactor only after tests pass (Refactor).
8. Update log artifacts after completing the iteration.

### 4.2 Mandatory Test-Driven Development (TDD)

TDD is mandatory for all implementation work. The Red / Green / Refactor cycle applies to every functional change:

- **Red** — write a failing test first.
- **Green** — implement the minimal code that passes the test.
- **Refactor** — improve the code without changing external behavior.

No production code is accepted unless it is covered by at least one automated test. Real external systems (DBMS, third-party APIs) are not used in unit tests — deterministic substitutes (stubs / mocks) are used instead.

### 4.3 Traceability Rule

Every implemented system behavior must have full traceability in the chain:

```
REQ -> AC -> Test -> Implementation
```

Functionality without a requirement identifier is not part of the system. A requirement without an acceptance criterion is not ready for implementation.

### 4.4 Test Log Artifacts

After each test run, the development agent records a log file with the results (REQ-NF-009). The log file must contain:

- total number of tests and the count of passed / failed;
- the status of each individual test (passed / failed / skipped);
- execution time of the test suite.

The log file is a machine-readable verification artifact — based on it, the development agent and human reviewer determine whether the task has been completed according to the specification.

---

## 5. Functional Requirements

### 5.1 Authentication and Account Management

| ID | Requirement |
|---|---|
| REQ-F-001 | The system shall allow user registration with email, password, and nickname (all three fields are mandatory). Re-registration with the same email is not allowed. |
| REQ-F-002 | The system shall allow account login with email and password. |
| REQ-F-003 | The system shall allow account logout. After logout, access to protected pages requires re-authentication. |
| REQ-F-029 | The user may change their nickname in account settings. |

### 5.2 Catalog

| ID | Requirement |
|---|---|
| REQ-F-004 | The system shall display a personal catalog — a list of all user content items. |
| REQ-F-005 | The system shall provide catalog filtering by item type (book / TV series / film). |
| REQ-F-006 | The system shall provide catalog filtering by item status. Available status values: "planned", "in progress", "completed", "on hold". |
| REQ-F-023 | The system shall provide catalog item search by title. |
| REQ-F-026 | The system shall provide catalog sorting: by date added (newest / oldest) and by rating (highest to lowest and vice versa). |

### 5.3 Content Item Management

| ID | Requirement |
|---|---|
| REQ-F-007 | The system shall allow adding a new content item with attributes: title (required), type (required), status, rating (0–10), notes, tags. The form displays type-specific optional fields (REQ-F-024) and a cover image field (REQ-F-025). |
| REQ-F-008 | The system shall allow editing any attribute of an existing content item. |
| REQ-F-009 | The system shall allow deleting a content item from the catalog. A deleted item is automatically removed from all collections. |
| REQ-F-024 | The add and edit item form shall display type-specific optional fields depending on the selected type (see table below). |
| REQ-F-025 | Each content item shall have a cover image: by default — one of three illustrations corresponding to the type. The user may replace it with their own image (optional). |
| REQ-F-028 | Cover image formats: JPEG, PNG, WebP; maximum file size: 5 MB. The system notifies the user when limits are violated. |

**Type-Specific Optional Fields:**

| Type | Optional Fields |
|---|---|
| Book | Author, number of pages |
| TV Series | Number of seasons |
| Film | Director, duration |

### 5.4 Tags

| ID | Requirement |
|---|---|
| REQ-F-010 | The system shall allow adding arbitrary tags to a content item. When entering a tag, the system offers autocomplete based on the user's previously entered tags. One item can have multiple tags. A tag can be removed at any time. |
| REQ-F-011 | The system shall provide catalog filtering and search by tag. |

### 5.5 Sessions (Repeated Viewings / Readings)

| ID | Requirement |
|---|---|
| REQ-F-012 | The system shall allow recording multiple Sessions for a single content item; each Session has its own date, rating, and note. |
| REQ-F-013 | The system shall display the list of all Sessions of a content item in reverse chronological order (newest to oldest), with the total count. |
| REQ-F-014 | The system shall allow editing and deleting an individual Session. |

### 5.6 Collections

| ID | Requirement |
|---|---|
| REQ-F-015 | The system shall allow adding a single catalog item to multiple collections simultaneously (many-to-many relationship). |
| REQ-F-016 | The system shall allow creating a new named collection. |
| REQ-F-017 | The system shall allow editing a collection name. |
| REQ-F-018 | The system shall allow deleting a collection. Deleting a collection does not delete items from the catalog. |
| REQ-F-019 | The system shall allow removing an item from a collection without deleting it from the catalog or other collections. |
| REQ-F-020 | The system shall display the contents of a collection — the list of items it contains, with the name, type, and status of each. |
| REQ-F-027 | The system shall provide sorting of items within a collection: by date added (newest / oldest) and by rating (highest to lowest and vice versa). |

### 5.7 Automatic Completion Date Fill

| ID | Requirement |
|---|---|
| REQ-F-021 | When changing an item's status to "completed", the completion date field shall be automatically filled with the current date if no date was entered manually. |

### 5.8 Personal Statistics

| ID | Requirement |
|---|---|
| REQ-F-022 | The system shall display personal statistics: the number of items with "completed" status broken down by type (books / TV series / films) and by selected time period. |
| REQ-F-022a | Time period selection for statistics — from predefined options: "this month", "this year", "all time". |

---

## 6. Non-Functional Requirements

### 6.1 Performance

**REQ-NF-001.** System pages shall load in an acceptable time for the user under normal network connection conditions.

### 6.2 Security

**REQ-NF-002.** User passwords are stored exclusively in a protected form — as hashes (e.g., bcrypt). Access to protected resources requires an active authenticated session.

**REQ-NF-007.** The authorization token is stored in an HTTP-only cookie to prevent XSS attacks. All requests that modify system state must be protected against CSRF attacks.

### 6.3 Reliability

**REQ-NF-003.** All user data is stored in the database. No user action shall result in the loss of previously entered data without explicit deletion confirmation from the user.

### 6.4 Usability

**REQ-NF-004.** The system's interface shall be responsive for desktop and mobile browsers. Separate tablet optimization is not planned for version v1.

**REQ-NF-008.** When the catalog is empty, a collection is empty, or search / filter results are absent, the system shall display an informative message instead of an empty list.

### 6.5 Compatibility

**REQ-NF-005.** The system shall function correctly in the latest two versions of: Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari (including mobile Safari on iOS).

### 6.6 Input Validation

**REQ-NF-006.** During new user registration, the system shall validate:
- email — format per RFC 5322;
- password — minimum length of 8 characters;
- nickname — 2 to 50 characters.

If any constraint is violated, the system displays a specific error message indicating the reason for rejection.

### 6.7 Development Process

**REQ-NF-009.** After each test run, the development agent shall write a log file to the `logs/` directory. The log file must contain: total number of tests, passed / failed / skipped count, status of each individual test (name + result), and execution time of the test suite.

---

## 7. Acceptance Criteria

| AC ID | Requirement | Acceptance Criterion |
|---|---|---|
| AC-001 | REQ-F-001 | After filling in a valid email, password, and nickname and confirming registration, the user gains access to an empty personal catalog. Re-registration with the same email is not possible: the system displays a message about an existing account. |
| AC-002 | REQ-F-002 | After entering the correct email and password, the user is redirected to their catalog. With incorrect credentials — an error message is displayed and login does not proceed. |
| AC-003 | REQ-F-003 | After logout, accessing protected pages redirects to the login page. Re-authentication restores access. |
| AC-004 | REQ-F-004 | The catalog displays all added items; for each item, the title, type, status, and rating are visible. |
| AC-005 | REQ-F-005 | When selecting type "Books", only items of type "book" are displayed; when the filter is cleared — all items are shown again. |
| AC-006 | REQ-F-006 | When selecting status "completed", only items with that status are displayed; when cleared — all items are shown again. |
| AC-007 | REQ-F-007 | After filling in required fields (title, type), the item appears in the catalog with its corresponding attributes and cover image. |
| AC-008 | REQ-F-008 | After editing and saving, the updated attributes are shown in the catalog and on the item page. |
| AC-009 | REQ-F-009 | After confirming deletion, the item disappears from the catalog and from all collections it belonged to. |
| AC-010 | REQ-F-010 | An added tag appears on the item card. When typing in the tag field — autocomplete suggestions from previously used tags are shown. Removing a tag does not affect other attributes. |
| AC-011 | REQ-F-011 | When filtering by tag, only items with that tag are displayed; the result updates when the filter is changed or cleared. |
| AC-012 | REQ-F-012 | For an item with two or more Sessions — a list of all records with date, rating, and note is shown. |
| AC-013 | REQ-F-013 | Sessions are sorted from newest to oldest; the total count is indicated. |
| AC-014 | REQ-F-014 | After editing a Session — updated data is shown. After deletion — the session disappears and the count decreases. |
| AC-015 | REQ-F-015 | An item is simultaneously displayed in each collection it has been added to. Removal from one collection does not affect the others. |
| AC-016 | REQ-F-016 | After entering a name, the new empty collection appears in the collections list. |
| AC-017 | REQ-F-017 | After saving, the new name is displayed in the list and in the page heading. |
| AC-018 | REQ-F-018 | After confirming deletion, the collection disappears; items remain in the catalog. |
| AC-019 | REQ-F-019 | After removing an item from a collection, it remains in the catalog and in other collections. |
| AC-020 | REQ-F-020 | The collection page displays all items with title, type, and status. |
| AC-021 | REQ-F-021 | If no date is entered when changing status to "completed" — the current date is automatically set. If entered manually — the entered value is saved. |
| AC-022 | REQ-F-022 | The statistics page displays the count of completed items by type and by the selected time period. |
| AC-023 | REQ-F-023 | When entering part of a title, the catalog displays only matching items; when cleared — all items are shown. |
| AC-024 | REQ-F-024 | The form displays type-specific fields only after a type is selected; all fields are optional. |
| AC-025 | REQ-F-025 | Without a custom image — the default illustration for the type is shown. After upload — the custom image is shown; it can be removed to restore the default. |
| AC-026 | REQ-F-026 | After selecting a sort parameter, the catalog is reordered; changing the parameter reorders it again. |
| AC-027 | REQ-F-027 | After selecting a sort parameter within a collection, the list is reordered. |
| AC-028 | REQ-F-028 | An attempt to upload a file of an unsupported format or larger than 5 MB — an error message is shown and the file is not saved. |
| AC-029 | REQ-F-029 | After changing the nickname in account settings, the new name is displayed in the interface. |
| AC-030 | REQ-F-022a | The statistics page contains a time period selector: "this month", "this year", "all time". |
| AC-031 | REQ-NF-006 | When a password shorter than 8 characters is entered — a specific message is shown. With an invalid email or a nickname outside 2–50 characters — a corresponding message is shown. |
| AC-032 | REQ-NF-008 | When the catalog is empty, a collection is empty, or search results are absent, an informative message is displayed (not an empty list). |
| AC-033 | REQ-NF-009 | After running tests, a file with the results of the last run exists in the `logs/` directory. The file contains: total number of tests, count of passed / failed / skipped, status of each test (name + result), and execution time of the suite. |
| AC-034 | REQ-NF-001 | The catalog page with up to 100 items renders within 3 s on a standard broadband connection. API responses for read operations return within 500 ms under single-user load. |
| AC-035 | REQ-NF-002 | Passwords are never stored in plain text; only a bcrypt hash is persisted in the database. Accessing any protected page without an active session redirects to the login page. |
| AC-036 | REQ-NF-003 | No user-initiated action (add, edit, delete, status change) results in silent data loss. When a server error occurs during a write operation, the system displays an error message and the data state remains unchanged. |
| AC-037 | REQ-NF-004 | All pages are usable and free of layout breakage on viewports from 375 px (iPhone SE) to 1440 px (desktop). No horizontal scroll appears on a 375 px viewport. |
| AC-038 | REQ-NF-005 | All functional scenarios execute without errors in the latest two releases of Chrome, Firefox, Edge, and Safari (desktop and mobile Safari on iOS 16+). |
| AC-039 | REQ-NF-007 | The session cookie is issued with the `HttpOnly` flag and is inaccessible via JavaScript. State-mutating requests without a valid CSRF token are rejected with HTTP 403. |

---

## 8. BDD Scenarios

```gherkin
Scenario: New user registration
  Given the registration page is open
  And email "test@example.com" is not yet registered in the system
  When the user enters email "test@example.com", a password, and a nickname
    and confirms registration
  Then the user gains access to an empty personal catalog
  And a repeated registration attempt with the same email shows the message
    "An account with this email already exists"

Scenario: Login with correct credentials
  Given the user is registered in the system
  When they enter the correct email and password and click "Sign in"
  Then they are redirected to their personal catalog
  And they see their previously added items

Scenario: Accessing a protected page after logout
  Given the user is logged in and viewing the catalog
  When the user clicks "Log out"
  Then they are redirected to the login page
  And navigating directly to /catalog redirects back to the login page
  And logging in again restores full access to the catalog

Scenario: Adding a new content item to the catalog
  Given the user is on the catalog page
  When the user opens the "Add Item" form,
    enters title "Dune" and selects type "Book",
    and submits the form
  Then the item "Dune" of type "Book" appears in the catalog
  And the item displays the default cover illustration for books
  And no other user's catalog is affected

Scenario: Deleting an item removes it from all collections
  Given item "Interstellar" exists in the catalog
  And "Interstellar" belongs to collections "Favourites" and "2025 Films"
  When the user confirms deletion of "Interstellar"
  Then "Interstellar" no longer appears in the catalog
  And "Interstellar" no longer appears in "Favourites" or "2025 Films"
  And both collections still exist and contain their other items

Scenario: Re-watching a film with a different rating
  Given content item "Film X" already has one Session with rating 9
  When the user adds a new Session for the same item
    with rating 5 and note "didn't enjoy it the second time"
  Then the content item has two Sessions, each with its own date,
    rating, and note
  And both ratings are stored separately, neither overwrites the other

Scenario: An item belongs to multiple collections simultaneously
  Given the user has item "Book Y" in the catalog
  And collections "Favourites" and "2026" exist
  When the user adds "Book Y" to both collections
  Then "Book Y" is displayed in the contents of both collections
  And removing "Book Y" from collection "2026" does not remove it
    from "Favourites" or from the catalog

Scenario: Automatic completion date fill
  Given the user is editing an item with status "in progress"
  When the user changes the status to "completed"
    and does not enter a date manually
  Then the system automatically sets the completion date
    equal to the current date

Scenario: Filtering the catalog by tag
  Given the catalog contains three items: two tagged "fantasy" and one without
  When the user selects the filter by tag "fantasy"
  Then only the two items tagged with that tag are displayed
  And when the filter is cleared, all three items are displayed again

Scenario: Searching the catalog by partial title
  Given the catalog contains "Dune", "Dune Messiah", and "Interstellar"
  When the user types "dune" in the search field
  Then only "Dune" and "Dune Messiah" are displayed
  And when the search field is cleared, all three items appear again

Scenario: Registration with invalid input is rejected
  Given the registration page is open
  When the user submits the form with password "abc" (fewer than 8 characters)
  Then the form is not submitted
  And the message "Password must be at least 8 characters" is shown
  When the user submits with a malformed email "notanemail"
  Then a message about an invalid email format is shown
  When the user submits with a nickname of 1 character
  Then a message about nickname length (2–50 characters) is shown
```

---

## 9. Requirements Traceability Matrix

| Requirement ID | Acceptance Criterion | BDD Scenario | Ticket | Test | Code | Documentation |
|---|---|---|---|---|---|---|
| REQ-F-001 | AC-001 | New User Registration | — | — | — | — |
| REQ-F-002 | AC-002 | Account Login | — | — | — | — |
| REQ-F-003 | AC-003 | Logout and Protected Page Access | — | — | — | — |
| REQ-F-004 | AC-004 | — | — | — | — | — |
| REQ-F-005 | AC-005 | — | — | — | — | — |
| REQ-F-006 | AC-006 | — | — | — | — | — |
| REQ-F-007 | AC-007 | Adding a New Item | — | — | — | — |
| REQ-F-008 | AC-008 | — | — | — | — | — |
| REQ-F-009 | AC-009 | Deleting an Item with Cascade Removal | — | — | — | — |
| REQ-F-010 | AC-010 | — | — | — | — | — |
| REQ-F-011 | AC-011 | Filtering by Tag | — | — | — | — |
| REQ-F-012 | AC-012 | Repeated Viewing with a Different Rating | — | — | — | — |
| REQ-F-013 | AC-013 | — | — | — | — | — |
| REQ-F-014 | AC-014 | — | — | — | — | — |
| REQ-F-015 | AC-015 | Item in Multiple Collections | — | — | — | — |
| REQ-F-016 | AC-016 | — | — | — | — | — |
| REQ-F-017 | AC-017 | — | — | — | — | — |
| REQ-F-018 | AC-018 | — | — | — | — | — |
| REQ-F-019 | AC-019 | Item in Multiple Collections | — | — | — | — |
| REQ-F-020 | AC-020 | — | — | — | — | — |
| REQ-F-021 | AC-021 | Automatic Completion Date Fill | — | — | — | — |
| REQ-F-022 | AC-022 | — | — | — | — | — |
| REQ-F-022a | AC-030 | — | — | — | — | — |
| REQ-F-023 | AC-023 | Searching by Partial Title | — | — | — | — |
| REQ-F-024 | AC-024 | — | — | — | — | — |
| REQ-F-025 | AC-025 | — | — | — | — | — |
| REQ-F-026 | AC-026 | — | — | — | — | — |
| REQ-F-027 | AC-027 | — | — | — | — | — |
| REQ-F-028 | AC-028 | — | — | — | — | — |
| REQ-F-029 | AC-029 | — | — | — | — | — |
| REQ-NF-001 | AC-034 | — | — | — | — | — |
| REQ-NF-002 | AC-035 | — | — | — | — | — |
| REQ-NF-003 | AC-036 | — | — | — | — | — |
| REQ-NF-004 | AC-037 | — | — | — | — | — |
| REQ-NF-005 | AC-038 | — | — | — | — | — |
| REQ-NF-006 | AC-031 | Registration Input Validation | — | — | — | — |
| REQ-NF-007 | AC-039 | — | — | — | — | — |
| REQ-NF-008 | AC-032 | — | — | — | — | — |
| REQ-NF-009 | AC-033 | — | — | — | — | — |

---

## Appendix A: Features Outside the MVP Scope

The following features are deliberately excluded from version v1 to constrain the scope of the first release. They may be considered for future versions of the system.

- Offline mode — full operation without an internet connection.
- Push and email notifications.
- Multi-language interface.
- "Friends" feature — mutual subscriptions, shared access to collections.
- Recommendations block or "Popular among users".
- Integration with external media content databases (TMDB, Google Books, etc.).
- Administrative panel.
- Email confirmation at registration (sending a verification code by email).
- Changing email address and changing password in account settings.
- Account deletion by the user.
