export const loginFormFields = [
  {
    id: "email",
    label: "Email",
    type: "text",
    placeholder: "name@company.com",
    required: true,
    description: "Enter the email associated with your account",
  },
  {
    id: "password",
    label: "Password",
    type: "text",
    placeholder: "••••••••",
    required: true,
    description: "Enter your password",
  },
  {
    id: "loginType",
    label: "Login Method",
    type: "select",
    options: ["Standard", "SSO", "2FA"],
    placeholder: "Select login method",
    required: true,
  },
  {
    id: "rememberDevice",
    label: "Security Options",
    type: "select",
    options: ["Remember this device", "Private/Incognito", "Public computer"],
    placeholder: "Select security option",
    description: "Choose how you want to be remembered on this device",
    required: true,
  },
  {
    id: "notes",
    label: "Login Notes",
    type: "text",
    placeholder: "Add any notes for this login session...",
    description: "Optional: Add notes for audit purposes",
    required: false,
  },
];

export const registrationFormFields = [
  {
    id: "name",
    label: "Full Name",
    type: "text",
    placeholder: "John Doe",
    required: true,
  },
  {
    id: "email",
    label: "Email",
    type: "text",
    placeholder: "name@company.com",
    required: true,
  },
  {
    id: "bio",
    label: "About You",
    type: "textarea",
    placeholder: "Tell us a bit about yourself...",
    required: false,
  },
  {
    id: "accountType",
    label: "Account Type",
    type: "select",
    options: ["Personal", "Business", "Enterprise"],
    placeholder: "Select account type",
    required: true,
  },
  {
    id: "password",
    label: "Password",
    type: "text",
    placeholder: "Create a strong password",
    required: true,
    description: "Must be at least 8 characters long",
  },
];
