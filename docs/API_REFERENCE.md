# LightLearn API Reference

This document provides a detailed reference for the LightLearn backend API.

**Base URL**: `/api`

## Authentication (`/auth`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new user | Public |
| `POST` | `/login` | Login user | Public |
| `GET` | `/me` | Get current user's profile | Authenticated |

## Users (`/users`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/profile` | Get current user's profile | Authenticated |
| `GET` | `/teachers` | Get all teachers | Teacher |
| `GET` | `/students` | Get all students | Teacher |

## Classes (`/classes`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/create` | Create a new class | Teacher |
| `POST` | `/join` | Join a class with a code | Student |
| `GET` | `/my-classes` | Get classes created by the teacher | Teacher |
| `GET` | `/enrolled` | Get classes the student is enrolled in | Student |
| `GET` | `/` | Get all classes | Authenticated |
| `GET` | `/:id` | Get class details | Authenticated |
| `GET` | `/:id/students` | Get list of students in a class | Teacher |

## Courses (`/courses`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/subjects` | Get all subjects | Authenticated |
| `GET` | `/subjects/:id` | Get subject details | Authenticated |
| `POST` | `/create` | Create a new subject | Teacher |
| `PUT` | `/subjects/:id` | Update a subject | Teacher |
| `DELETE` | `/subjects/:id` | Delete a subject | Teacher |

## Live Sessions (`/live-sessions`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/process/:sessionId` | Process a recorded session (transcribe + summarize) | Authenticated |
| `GET` | `/session/:sessionId` | Get processed session data | Authenticated |
| `GET` | `/download/:sessionId/transcription` | Download transcription file | Authenticated |
| `GET` | `/download/:sessionId/summary` | Download summary file | Authenticated |
| `GET` | `/recordings` | List all recordings | Authenticated |

## Assignments (`/assignments`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/create` | Create a new assignment | Teacher |
| `GET` | `/my-assignments` | Get assignments created by the teacher | Teacher |
| `PUT` | `/:id` | Update an assignment | Teacher |
| `DELETE` | `/:id` | Delete an assignment | Teacher |
| `GET` | `/:id/submissions` | Get submissions for an assignment | Teacher |
| `PUT` | `/submissions/:id/grade` | Grade a student submission | Teacher |
| `GET` | `/class/:classId` | Get all assignments for a class | Authenticated |
| `GET` | `/:id` | Get assignment details | Authenticated |
| `POST` | `/:id/submit` | Submit an assignment | Student |

## Quizzes (`/quizzes`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/create` | Create a new quiz | Teacher |
| `GET` | `/my-quizzes` | Get quizzes created by the teacher | Teacher |
| `PUT` | `/:id` | Update a quiz | Teacher |
| `DELETE` | `/:id` | Delete a quiz | Teacher |
| `GET` | `/class/:classId` | Get all quizzes for a class | Authenticated |
| `GET` | `/:id` | Get quiz details | Authenticated |
| `POST` | `/:id/submit` | Submit a quiz response | Student |

## Polls (`/polls`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/create` | Create a new poll | Teacher |
| `GET` | `/my-polls` | Get polls created by the teacher | Teacher |
| `GET` | `/class/:classId` | Get all polls for a class | Authenticated |
| `POST` | `/:id/vote` | Vote on a poll | Student |

*(Note: Verify exact endpoints for Polls in `polls.routes.js` if needed, structured based on patterns)*

## Doubts (`/doubts`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/create` | Post a doubt | Student |
| `GET` | `/class/:classId` | Get doubts for a class | Authenticated |
| `POST` | `/:id/reply` | Reply to a doubt | Authenticated |

*(Note: Verify exact endpoints for Doubts in `doubts.routes.js` if needed)*
