# ACHEIVE AI

## Overview

ACHEIVE AI is a Gen AI-powered gamified habit tracking web application that helps users stay consistent with their daily habits using XP points, streaks, levels, badges, and fun mind games. The goal is to make self-improvement simple, motivating, and enjoyable.

---

## Key Features

* Create and track daily habits
* Streak system to build consistency
* XP & Level system for motivation
* Badge system (Bronze, Silver, Gold)
* Mind games to earn Focus XP
* AI Chatbot powered by AWS Bedrock (Claude 3.5 model)
* Secure integration using IAM Roles
* Personalized dashboard

---

## Chatbot System

ACHEIVE AI includes an intelligent Gen AI chatbot built using **AWS Bedrock with the Claude 3.5 model**. The chatbot acts as a virtual motivation partner that guides users, answers questions, provides habit-building suggestions, and delivers encouraging responses based on user progress.

Key highlights:

* Powered by Claude 3.5 via AWS Bedrock
* Secure access managed through IAM Roles
* Real-time conversational support
* Encourages habit consistency and productivity
* Integrated with the application workflow for personalized assistance

---

## Tech Stack

### Frontend

* React 18 + TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Wouter for routing

### Backend

* Express.js + TypeScript
* JWT Authentication
* PostgreSQL database
* Drizzle ORM
* Chatbot integrated via AWS Bedrock (Claude 3.5)

---

## Core Pages

* Home
* Dashboard
* Mind Games
* Chatbot
* Profile
* Authentication (Login / Signup)
* Feedback

---

## Gamification System

* XP earned by completing habits
* Focus XP from mind games
* Levels based on total XP
* Streak tracking for daily consistency
* Badges:

  * Bronze – 100 XP
  * Silver – 500 XP
  * Gold – 1000 XP

---

