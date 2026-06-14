# Testing Components and Routes

This directory contains test components and routes that are only available in the development environment. These components can be useful for various testing purposes.

## Usage

These components are automatically included in the application's routes when running in the development environment. You can access them through the dedicated test routes section in the sidebar.

The test routes are managed in the `testRoutes.jsx` file and are included in the application only when the environment is set to development mode.

## Development Mode Indicator

A development mode banner is displayed in the bottom-left corner of the application when running in development mode. This banner indicates that test routes are enabled.

## Available Test Components

1. **Testing JSX Structure** - Basic component showing various HTML/JSX rendering capabilities

## Adding New Test Components

To add a new test component:

1. Create your component in the appropriate directory (`testing_jsx/` or `testing_tsx/`)
2. Import and add it to the `testRoutes.jsx` file

Test components will only be visible when the application runs in development mode.
