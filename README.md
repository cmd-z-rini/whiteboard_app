
# Whiteboard Helper 🖍️

> A specialized, infinite-canvas whiteboarding tool designed specifically for Product Design and PM interview prep. Built as an experiment in AI-assisted development.

<img width="1440" height="796" alt="image" src="https://github.com/user-attachments/assets/dbe9ff3d-6911-4357-a20d-56baccf19956" />


## 🚀 The "Why"
I needed a clean, distraction-free space to practice whiteboarding frameworks for my upcoming interviews. Instead of using existing tools, I decided to test the limits of modern Agentic IDEs (AI coding agents) to build a custom, FigJam-style whiteboard from scratch. 

This repository is the result of that experiment: halfway between a practical interview tool and a deep dive into the generative curve.

## ✨ Features
* **Infinite Canvas:** Pan and zoom freely across a dot-grid workspace.
* **FigJam-Style Connections:** Drag-and-drop node connection engine (arrows) to link ideas and screens.
* **Design Thinking Templates:** Pre-built components for:
  * Persona Cards
  * Empathy Maps
  * User Journeys & Flows
  * Prioritization Matrices
* **Custom SVG Wireframes:** Drop "naked" mobile device frames directly onto the canvas to sketch out UI flows.
* **Atomic Tools:** Sticky notes, freehand pen drawing, simple shapes, and typography.
* **Export:** One-click export of your session to PNG for your portfolio or interview follow-ups.

## 🛠️ Tech Stack
* **Framework:** React + TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Architecture:** Custom SVG overlay engine for node routing, custom math-based resize engine to prevent layout squashing on complex grids.

## 🏃‍♂️ Running it Locally

Want to spin it up yourself? It's just two commands.

1. Clone the repository and install dependencies:
   
   npm install

2. Start the local development server:
   
   npm run dev


----------------------------------------------------------

Because this was heavily built using an AI agent, I am actively looking for feedback on the UX, the component architecture, and feature requests.

If you try it out, let me know what you think: https://tally.so/r/Pd6q2P

Built with coffee, curiosity, and a lot of prompts.
