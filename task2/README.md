# Task 2: Usage Admin Console

## Setup Instructions
1. Start the service: `docker compose up`
2. Access the dashboard at `http://localhost:3000`

## State Management Decisions
* **Filters/Dates:** Live in the **URL** (via React Router `useSearchParams`). This ensures the current dashboard view can be bookmarked or shared without losing context.
* **Table/Chart Data:** Lives in **Client State**. The table utilizes a silent background polling mechanism to fetch drifting data without resetting the user's `selectedRow`.
* **Form Drafts:** Live on the **Server**. The client only holds temporary typing state until "Next" is clicked, pushing the draft to the server to allow cross-device resuming.

## Trade-offs & What Was Cut
* **Complex Global State (Redux/Zustand):** Cut to prioritize simplicity. Passing props and utilizing URL parameters was sufficient for a dashboard of this size, adhering to the principle of using the least complexity that works.
* **Heavy CSS/Animations:** I utilized pure Tailwind utility classes for layout and responsiveness (down to 375px), prioritizing the complex error handling and async failure states over heavy aesthetic animations.

## Failure Behavior
* **Random Chart Failures (500s):** The chart component isolates its own API calls. When the simulated 20% failure occurs, it catches the error and displays a localized "Retry" button rather than crashing the page or showing a blank container.
* **Step 2 Validation Trick:** If the server returns a `422` error on Step 4 targeting Step 2, the `SettingsWizard` catches the specific `err.step` parameter, automatically routes the user back to the broken step, and highlights the specific field without erasing any drafted data.