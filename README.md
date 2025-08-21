# Financial Dashboard


Financial Dashboard is a minimal Node.js Express web application that serves static financial reports and provides a /health endpoint for monitoring. The app is designed for web development and can be extended to support more advanced dashboard features.

## Features

- Serves static HTML financial reports from the `public/reports/` directory
- `/health` endpoint for service status
- Easily extensible for new web features and APIs

## Project Structure

- `server.js` – Main Express server
- `public/` – Static assets (HTML, CSS, JS, reports)
- `package.json` – Project metadata and dependencies

## Getting Started

## Run

```bash
npm install
npm start
```


The `PORT` environment variable is supported (defaults to 3002).

## Development

This project is set up for web development. You can add new HTML, CSS, or JavaScript files to the `public/` directory, or extend the Express server for new API endpoints.

### Useful Commands

- `npm install` – Install dependencies
- `npm start` – Start the server
- `npm run dev` – Start in development mode

## Agent Instructions (for AI/Automation)

This repository is a web development environment. The agent should:

- Support the development of web applications (HTML, CSS, JS, Node.js, Express)
- Help with adding, editing, or debugging static and dynamic web content
- Assist in creating new endpoints, serving assets, and improving the dashboard UI/UX
- Provide best practices for web development and code organization

---
