# GiaPha

> An open-source genealogy and family tree platform designed for Vietnamese families and clans.

GiaPha is a modern web application for preserving family history, managing multi-generation relationships, and visualizing genealogical information in an accessible and structured way.

The project is built with a Vietnamese-first use case in mind, while keeping the architecture simple enough to self-host, extend, and adapt for different families or communities.

---

## ✨ Features

### 🌳 Interactive Family Tree
Visualize family members across multiple generations in an interactive genealogy tree.

### 👥 Member Management
Create and maintain structured information for family members.

Current member workflows include:

- Add a new member
- Edit existing member information
- Add a relative from an existing family member
- Define parental relationships
- Organize members by generation

### 📋 Tree & List Views
Switch between:

- **Family Tree View** for visual relationships
- **Member List View** for easier browsing and lookup

### 🔎 Search
Quickly search through family members and locate people in the genealogy database.

### 🔐 Privacy Mode
Family records can be protected behind a private access mode.

When privacy mode is enabled, unauthenticated or guest users cannot access protected family information.

### 👤 Authentication & Roles
The application includes a basic authentication system with role-aware access.

This makes it possible to separate public viewing from internal family administration.

### 🌓 Light & Dark Themes
Built-in light and dark themes with the selected preference stored locally in the browser.

### ☁️ Cloudflare-Native Architecture
GiaPha is designed to run on Cloudflare infrastructure using:

- Cloudflare Pages
- Cloudflare Functions
- Cloudflare D1
- Wrangler

This provides a lightweight and globally distributed deployment model without requiring a traditional always-on server.

---

## 🎯 Project Goals

Family history is often stored across handwritten genealogy books, spreadsheets, documents, photographs, and the memories of older generations.

GiaPha aims to provide an open and maintainable platform that helps families:

- Preserve genealogical records digitally
- Visualize complex multi-generation relationships
- Make family history easier to explore
- Protect private family information
- Maintain records collaboratively
- Reduce dependence on proprietary genealogy platforms
- Build tools that better fit Vietnamese family structures and cultural use cases

The long-term goal is to make GiaPha a reusable open-source foundation for digital genealogy projects.

---

## 🖼️ Screenshots

Screenshots and a public demo will be added as the project evolves.

<!--
Recommended structure:

![Family Tree](./docs/screenshots/family-tree.png)

![Member Details](./docs/screenshots/member-details.png)

![Member List](./docs/screenshots/member-list.png)
-->

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | User interface |
| Vite 8 | Frontend tooling and build system |
| Hono | Lightweight backend/API framework |
| Cloudflare Pages | Hosting and deployment |
| Cloudflare Functions | Server-side API endpoints |
| Cloudflare D1 | Genealogy database |
| Wrangler | Local Cloudflare development and deployment |
| ESLint | Code quality |

---

## 🏗️ Architecture

```text
Browser
   │
   ▼
React + Vite
   │
   ▼
Cloudflare Pages
   │
   ├── Static frontend
   │
   └── Cloudflare Functions / Hono API
                  │
                  ▼
             Cloudflare D1
                  │
                  ▼
          Genealogy database
