# Project Guidelines

## Project Overview

### Project Goal

Develop a high-performance event ticketing platform similar to **iticket.uz**.

### Technology Stack

| Component            | Technology                 |
|----------------------|----------------------------|
| Language             | Python 3.12+               |
| Framework            | Django Ninja (Async)       |
| ORM                  | Django ORM (Async)         |
| Validation           | Pydantic v2, Ninja Schemas |
| Authentication       | JWT                        |
| Internationalization | Django Parler              |
| Filtering            | Django Filter              |

---

# Architecture

The project follows a **Layered Clean Architecture** to keep business logic isolated from the API layer and maintain a
scalable codebase.

## Directory Structure

```
app/
├── api/          # API endpoints and routers
├── schema/       # Request and Response schemas (Pydantic v2)
├── models/       # Django ORM models
├── admin/        # Django Admin configuration
```

### Responsibilities

#### `app/api/`

Contains:

* Django Ninja routers
* API endpoints
* Request handling
* Response generation

Business logic should **not** be implemented here.

---

#### `app/schema/`

Contains:

* Request schemas
* Response schemas
* Validation logic

Use **Pydantic v2** and **Ninja Schema** features whenever possible.

---

#### `app/models/`

Contains:

* Django ORM models
* Relationships
* Model methods (only when closely related to the model)

Avoid placing business workflows inside models.

---

#### `app/admin/`

Contains:

* Django Admin configuration
* Model registration
* Admin customization

---

# Coding Standards

## General Rules

* Write clean, readable, and maintainable code.
* Follow the **DRY (Don't Repeat Yourself)** principle.
* Prefer composition over duplication.
* Keep functions small and focused on a single responsibility.
* Use meaningful variable, function, and class names.
* Favor asynchronous implementations whenever supported.

---

## Comments

* Write code comments only when they improve understanding.
* Comments may be written in **English** or **Uzbek**.
* Avoid commenting obvious code.

---

## Existing Code

When modifying existing code:

* Preserve the current coding style.
* Keep naming conventions consistent.
* Do not refactor unrelated code unless explicitly requested.
* Minimize unnecessary changes.

---

# Django Guidelines

* Use Django ORM for all database operations.
* Prefer asynchronous ORM methods whenever available.
* Avoid raw SQL unless absolutely necessary.
* Keep database queries optimized.
* Prevent N+1 query problems using appropriate query optimization techniques.

---

# API Guidelines

* Use Django Ninja routers.
* Validate all incoming data using Pydantic v2 schemas.
* Return consistent response structures.
* Use proper HTTP status codes.
* Handle exceptions gracefully.

---

# Schema Guidelines

* Separate Request and Response schemas.
* Keep schemas reusable.
* Avoid duplicating validation logic.
* Use descriptive field names and type hints.

---

# Code Quality

Every generated solution should be:

* Modular
* Readable
* Reusable
* Type-safe
* Production-ready
* Easy to maintain

Avoid:

* Dead code
* Large monolithic functions
* Unnecessary abstractions
* Repeated logic
* Magic numbers or hardcoded values

---

# Output Preferences

Unless explicitly requested otherwise:

* Produce complete, working code.
* Include all required imports.
* Preserve project structure.
* Explain only when necessary.
* Do not generate placeholder implementations if a complete solution is possible.

Prioritize correctness, maintainability, readability, and consistency over clever or overly complex implementations.
