# EIMS Migration Documentation

## Overview

This documentation provides a comprehensive guide for migrating the **Equipment & Inventory Management System (EIMS)** from Django + Vue 3 to Next.js with Server Actions.

## Documentation Structure

### 1. System Understanding
- **[01-system-overview.md](./01-system-overview.md)** - High-level architecture, features, and current tech stack
- **[02-data-models.md](./02-data-models.md)** - Complete data model documentation with relationships
- **[03-api-endpoints.md](./03-api-endpoints.md)** - All API endpoints organized by module

## Quick Start

1. **Understand the Current System**: Start with documents 01-07 to understand the existing architecture
2. **Plan the Migration**: Review documents 08-10 for migration strategy
3. **Implement**: Follow the step-by-step guides in each document
4. **Test & Deploy**: Use documents 11-12 for testing and deployment

## Key Technologies

### Current Stack
- **Backend**: Django 5.0, Django REST Framework
- **Frontend**: Vue 3, Vue Router, Vuex/Pinia
- **Database**: SQLite (development), MySQL (production option)
- **File Storage**: Cloudinary
- **Authentication**: Token-based (Django REST Framework)

### Target Stack
- **Framework**: Next.js 14+ (App Router)
- **Backend**: Next.js Server Actions
- **Frontend**: React 18+ (Server & Client Components)
- **Database**: PostgreSQL with Prisma/Drizzle ORM
- **File Storage**: Cloudinary (maintained)
- **Authentication**: NextAuth.js or custom JWT

## System Modules

The EIMS consists of five main modules:

1. **Users** - User management, authentication, departments, rooms
2. **Secretary** - Item management, borrowing, returns (general equipment)
3. **Labtech** - Laboratory equipment, apparatus, chemicals management
4. **Supply** - Supply office operations, chemical assignments
5. **Staff** - Staff requests (transfer, replace, dispose)

## User Roles

- **Superuser** - Full system access
- **Admin** - User and department management
- **Secretary** - Item borrowing and returns
- **Lab Technician** - Laboratory equipment and chemicals
- **ICT Technician** - ICT equipment management
- **Supply Office** - Supply management and assignments
- **Dean** - Oversight and reporting
- **Staff** - Equipment requests and usage

## Key Features

- Multi-role user management
- Equipment and inventory tracking
- Barcode generation and scanning
- Borrowing and return workflows
- Chemical inventory management
- Equipment assignment tracking
- Transfer and disposal requests
- Dashboard analytics
- Real-time availability tracking

## Migration Goals

1. **Modernize Stack**: Move to Next.js for better performance and DX
2. **Simplify Architecture**: Use Server Actions instead of separate API
3. **Improve Type Safety**: Leverage TypeScript throughout
4. **Enhance Performance**: Utilize React Server Components
5. **Maintain Features**: Preserve all existing functionality
6. **Improve UX**: Better loading states and error handling

## Contributing

When updating this documentation:
- Keep code examples up to date
- Include both Django and Next.js equivalents
- Add migration notes for breaking changes
- Update diagrams when architecture changes

## Support

For questions or issues during migration:
1. Review the relevant documentation section
2. Check the comparison tables for Django vs Next.js patterns
3. Refer to the code examples in each document
