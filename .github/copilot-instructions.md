Here's a concise and improved version of the VS Code Copilot instructions for your Firebase React project:

# Firebase React Project Instructions

This project is a React (TypeScript, Vite) application utilizing Mantine UI and Firebase. Development uses Firebase emulators.

## Technologies
- **Frontend**: React, TypeScript, Vite, Mantine UI, React Router
- **Backend**: Firebase
- **Authentication**: Google OAuth (Admin/User roles, RBAC)
- **Development**: Firebase Emulators

## Development Guidelines
- Functional components with hooks, Context API for state.
- Follow React best practices:
  - Avoid class components unless necessary.
  - Use these links and it's subpages for reference:
    - https://react.dev/learn/escape-hatches
    - https://react.dev/learn/you-might-not-need-an-effect
    - https://react.dev/reference/react/hooks
    - https://react.dev/reference/react/lazy
- TypeScript for type safety (use interfaces and classes).
- Mantine components for UI consistency, including notifications for user feedback and error handling.
 - Use these links and it's subpages for reference:
   - https://mantine.dev/core/package/
   - https://mantine.dev/theming/mantine-provider/
   - https://mantine.dev/getting-started/
   -https://mantine.dev/theming/mantine-provider/
- Use Firebase hooks for real-time data updates.
 - Use Firestore onSnapshot for data fetching.
 - Use Firebase Functions for backend logic.
 - Use Firebase official documentations for best practices:
   - https://firebase.google.com/docs
   - https://firebase.google.com/docs/firestore/quickstart#web_1
   - https://firebase.google.com/docs/firestore/query-data/listen
- Implement proper loading states.
- Avoid drastic changes without clear justification.
- Before starting new servers, check for existing related instances.
- Prefer simple solutions and avoid code duplication.
- Make only requested or clearly related changes. Ask for clarification if unsure.
- When fixing bugs, check the codebase for existing implementation options before introducing new patterns/technologies; remove old implementations if new ones are adopted.
- Maintain a clean, organized codebase.
- Avoid standalone scripts in files, especially for one-time runs.
- Keep files under 200-300 lines; refactor as needed.
- Mock data solely for tests; never for development or production environments.
- Do not add stubbing or fake data patterns affecting dev/prod.
- Focus on task-relevant code; avoid unrelated changes.
- Do not majorly alter established feature patterns/architecture unless there is a better pattern and you are explicitly instructed.
- Consider impacts of code changes on other methods/areas.
- Check for updated packages/libraries and official documentation for best practices.
- Use PowerShell commands for Windows development.

## Firebase Emulator Endpoints
- **Authentication**: `localhost:9099`
- **Firestore**: `localhost:8080`
- **Storage**: `localhost:9199`
- **Functions**: `localhost:5001`
- **Emulator UI**: `localhost:4000`