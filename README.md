# CourtIQ — AI Tennis Performance Analyzer

Full-stack AI-powered tennis analytics platform for tracking matches, training sessions, and getting personalized coaching insights.

## Live Demo
🎾 **[courtiq-frontend-cyan.vercel.app](https://courtiq-frontend-cyan.vercel.app)**

> Note: Backend is on Render free tier — first load may take 30-60 seconds to wake up.

## Features
- Log match stats and get AI coaching reports powered by Groq (Llama 3.3 70B)
- Track training sessions with AI coaching tips
- Performance dashboard with win rate, serve %, trends charts
- Progress tracking, goal setting, opponent head-to-head records
- Match journal with mood and performance ratings
- Video analysis with shot detection and pose scoring (OpenCV + MediaPipe)

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Recharts |
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL |
| AI | Groq API (Llama 3.3 70B) |
| Auth | JWT |
| Deployment | Vercel (frontend) + Render (backend) |

## Backend Repo
[github.com/shivaaniganesh2307-source/courtiq-backend](https://github.com/shivaaniganesh2307-source/courtiq-backend)
