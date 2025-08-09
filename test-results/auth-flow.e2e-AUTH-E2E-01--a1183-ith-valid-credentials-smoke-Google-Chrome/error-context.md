# Page snapshot

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- heading "Welcome to AgendaIQ" [level=1]
- button "Sign in with Google":
  - img
  - text: Sign in with Google
- text: Or continue with
- heading "Sign in to your account" [level=2]
- text: Email address
- textbox "Email address": admin@school.edu
- text: Password
- textbox "Password": Admin123!@#
- checkbox "Remember me"
- text: Remember me
- checkbox "Trust this device for 30 days"
- text: Trust this device for 30 days
- heading "Invalid email or password" [level=3]
- button "Sign in"
- link "Forgot your password?":
  - /url: /auth/forgot-password
- paragraph:
  - text: Don't have an account?
  - link "Sign up":
    - /url: /auth/signup
```