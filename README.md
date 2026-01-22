# AI Data Camp

AI Data Camp is a student-friendly web experience for ages 12-15 that explains what AI is, where it shows up, and how to use it safely. The site is fully static (HTML/CSS/JS) and runs in any modern browser.

## Core experiences
- Home landing page with an intro, call-to-action, and theme toggle
- Learn Modules area with step-by-step or all-at-once viewing
- Module completion tracking and a final test gate
- AI Mentor chat quiz with scenarios, scoring, and feedback
- Interactive mini-games and quizzes embedded in modules

## Features and possibilities

### Global UI
- Light/Dark theme toggle with localStorage persistence
- Animated on-scroll reveal effects
- Back-to-top floating button
- Mascot helper that shares random AI facts
- Responsive layouts for mobile and desktop

### Learning modules
- Step-by-step module flow or view all modules at once
- Next-module auto-reveal with smooth scrolling
- Module expand/collapse for extra reading
- Mark-as-completed buttons with badge states
- Progress tracking stored in localStorage
- Final test locked until all modules are completed
- Progress bar for final test unlock
- Quick-jump buttons to module sections

### Audio read-aloud
- Read-aloud controls for module content
- Pause, resume, and stop controls
- Automatic English voice selection when available

### AI Mentor chat quiz
- Scenario-based chat interface
- Typewriter effect for AI responses
- Multiple-choice answers with up to two attempts
- Per-question explanations and feedback
- Score tracking with summary at the end
- Jump controls to move between scenarios
- Restart/play-again flow
- Fallback embedded quiz data if JSON fails to load

### Interactive activities
- Deepfake image quiz with instant feedback
- Data Detective permissions mini-game with summary tips

## Content areas
- AI basics, bias, and safe AI use modules
- Teacher resources, discussion prompts, and lesson materials
- Student materials and worksheets (PDFs)

## Local data used
- Module completion progress (localStorage)
- Theme preference (localStorage)

## Files of interest
- `index.html` (home)
- `modules/` (learning modules)
- `ai-mentor.html` (AI Mentor quiz)
- `script.js` (interactions)
- `style.css` (visual design)
- `quiz.json` (quiz data)

## Running the site
Open `index.html` in a browser. No build step required.