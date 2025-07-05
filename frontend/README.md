# GHHS Property Management System

A comprehensive property management system built with React, TypeScript, and Tailwind CSS, designed to manage properties, maintenance requests, and tenant information.

## Overview

GHHS Property Management System provides essential features for property management including:

- **Maintenance Management**: Track and manage beeping alarms and maintenance requests
- **Property Management**: Manage property information and tenant details
- **User Management**: Handle user authentication and profiles
- **Modern UI**: Built with React 19, TypeScript, and Tailwind CSS
- **Dark Mode Support**: Full dark/light theme switching

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Django, PostgreSQL
- **Authentication**: Kinde
- **Hosting**: Fly.io

## Features

### Core Functionality
- ✅ Beeping Alarms Management
- ✅ Property Information Tracking
- ✅ Tenant Management
- ✅ Maintenance Request Tracking
- ✅ User Authentication
- ✅ Responsive Design
- ✅ Dark/Light Mode

### UI Components
- ✅ Data Tables with Sorting & Filtering
- ✅ Modal Components
- ✅ Form Elements
- ✅ Navigation & Layout
- ✅ Theme Switching
- ✅ Responsive Design

## Installation

### Prerequisites

- Node.js 18.x or later (recommended Node.js 20.x)
- npm or yarn

### Setup

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components (DataTable, Filters, etc.)
│   │   ├── maintenance/     # Maintenance-specific components
│   │   ├── ui/             # Base UI components (Button, Modal, etc.)
│   │   ├── form/           # Form components
│   │   └── layout/         # Layout components
│   ├── pages/
│   │   ├── Dashboard/      # Main dashboard
│   │   ├── Maintenance/    # Maintenance pages
│   │   └── AuthPages/      # Authentication pages
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   └── types/              # TypeScript type definitions
```

## Development

### Key Components

- **BeepingAlarms**: Main maintenance management interface
- **DataTable**: Reusable table component with sorting/filtering
- **Modal**: Reusable modal component
- **FiltersCard**: Advanced filtering interface

### Adding New Features

1. Create components in appropriate directories
2. Use existing UI components from `src/components/ui/`
3. Follow TypeScript patterns established in the codebase
4. Ensure dark/light mode compatibility

## License

This project is proprietary to GHHS.

## Support

For support and questions, please contact the development team.
