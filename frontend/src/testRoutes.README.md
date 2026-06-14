# Test Routes

This file contains routes that are only available in the development environment. These routes are automatically added to the application's routing when running in development mode.

## How Test Routes Work

1. Test routes are defined in `testRoutes.jsx`
2. They are only included when the application runs in development mode
3. The `routesConfig.js` file controls the inclusion of test routes based on environment

## Test Route Structure

Test routes follow the same structure as regular routes:

```jsx
{
  type: "collapse",
  name: "Component Name",
  key: "unique-key",
  icon: <Icon />,
  route: "/test/route-path",
  component: <TestComponent />,
}
```

## Development Mode Detection

The application determines if it's running in development mode by checking:
- Vite's environment variable: `import.meta.env.MODE`
- Custom environment variable: `import.meta.env.VITE_CUSTOM_APP_ENV`

Both are checked in case one is unavailable or incorrect.

## Visual Indicator

A development mode banner appears in the application when running in development mode, indicating that test routes are enabled.
