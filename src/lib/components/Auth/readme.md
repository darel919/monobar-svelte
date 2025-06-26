# Authentication System - Monobar Svelte

This authentication system provides popup-based authentication, allowing users to authenticate without leaving the current page.

## Components

### 1. AuthSession
A wrapper component that provides authentication state and conditional rendering.

```svelte
<script>
  import { AuthSession } from '$lib';
</script>

<AuthSession>
  <div slot="authenticated" let:isAuthenticated>
    <!-- Content shown when user is authenticated -->
    <p>Welcome! You are logged in.</p>
  </div>
  
  <div slot="unauthenticated" let:openAuthModal>
    <!-- Content shown when user is not authenticated -->
    <button on:click={openAuthModal}>Login</button>
  </div>
</AuthSession>
```

### 2. ProtectedRoute
A component that protects entire pages or sections requiring authentication.

```svelte
<script>
  import { ProtectedRoute } from '$lib';
</script>

<ProtectedRoute requireAuth={true}>
  <div slot="default" let:isAuthenticated let:userSession>
    <!-- Protected content -->
    <h1>Premium Content</h1>
    <p>User: {userSession?.user?.email}</p>
  </div>
</ProtectedRoute>
```

### 3. LoginButton
A standalone login button with popup authentication.

```svelte
<script>
  import { LoginButton } from '$lib';
</script>

<LoginButton 
  redirectPath="/dashboard" 
  className="btn-primary"
/>
```

## Authentication Store

The authentication state is managed by a Svelte store that can be imported and used directly:

```svelte
<script>
  import { authStore } from '$lib';
  
  // Subscribe to auth state
  $: isAuthenticated = $authStore.isAuthenticated;
  $: userSession = $authStore.userSession;
  
  // Check auth status
  authStore.checkAuthStatus();
  
  // Logout
  authStore.logout();
</script>
```

## Authentication Utils

Utility functions for authentication:

```javascript
import { openLoginWindow, redirectToLogin, useRequireAuth } from '$lib';

// Open popup authentication
openLoginWindow('/current-path', (error) => {
  console.error('Auth failed:', error);
});

// Redirect to login page
redirectToLogin('/current-path');

// Check if auth is required
const { checkAuth } = useRequireAuth();
if (!checkAuth()) {
  // Handle unauthenticated state
}
```

## Pages

### Authentication Callback (`/auth`)
Handles the popup authentication callback and processes authentication tokens.

### Login Page (`/login`)
A dedicated login page with authentication options.

### Protected Page Example (`/premium`)
Demonstrates how to create a protected page that requires authentication.

## Environment Variables

The authentication system uses the existing `DARELISME_URL` from your `.env` file:

```
DARELISME_URL=https://darelisme.my.id
```

## Features

- **Popup Authentication**: Users can authenticate without leaving the current page
- **Automatic State Management**: Authentication state is automatically synchronized across the app
- **Protected Routes**: Easy-to-use components for protecting pages and content
- **Persistent Sessions**: Authentication state persists across browser sessions
- **Error Handling**: Graceful handling of authentication errors and popup blocks
- **TypeScript Support**: Full TypeScript support for type safety

## Usage Examples

### Basic Authentication Check
```svelte
<script>
  import { AuthSession } from '$lib';
</script>

<AuthSession let:isAuthenticated>
  {#if isAuthenticated}
    <p>User is logged in</p>
  {:else}
    <p>User is not logged in</p>
  {/if}
</AuthSession>
```

### Role-based Access
```svelte
<script>
  import { ProtectedRoute } from '$lib';
</script>

<ProtectedRoute 
  requireAuth={true} 
  allowedRoles={["admin", "superadmin"]}
>
  <div slot="default">
    <!-- Admin-only content -->
  </div>
</ProtectedRoute>
```

### Custom Login Component
```svelte
<script>
  import { AuthSession, LoginButton } from '$lib';
</script>

<AuthSession requireAuth={true} showLoginButton={false}>
  <div slot="unauthenticated">
    <h2>Please Log In</h2>
    <LoginButton className="btn-lg btn-primary" />
  </div>
  
  <div slot="authenticated">
    <h2>Welcome Back!</h2>
    <!-- Authenticated content -->
  </div>
</AuthSession>
```

## Integration with Existing Components

The authentication system is already integrated into:
- **Navbar**: Shows login/logout options based on authentication state
- **Home Page**: Demonstrates conditional content based on auth status
- **Premium Page**: Example of a fully protected page

This implementation provides a seamless authentication experience that matches the behavior of the NextJS version while being fully compatible with Svelte's reactive patterns.
