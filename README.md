# PingChat - Real-Time Messaging App

A full-stack, real-time chat application built to provide seamless communication. It utilizes a modern tech stack featuring Node.js, Express, React, and MongoDB, with live messaging powered by Socket.IO.

---

## 🚀 Tech Stack

### Frontend
* **React** - Component-based UI library.
* **React Router** - For client-side navigation (`/login`, `/chats`, etc.).
* **Tailwind CSS** - Utility-first framework for rapid and responsive styling.
* **Socket.IO Client** - Enables real-time, bidirectional communication.
* **Axios** - For handling HTTP requests to the backend.

### Backend
* **Node.js** - JavaScript runtime for the server.
* **Express.js** - Framework for building RESTful APIs.
* **Socket.IO** - Manages real-time WebSockets for instant messaging, read receipts, and online status.
* **Mongoose** - ODM for interacting with MongoDB.
* **JWT (JSON Web Tokens)** - Secure stateless authentication (using `JWT_ACCESS`).
* **Multer** - Middleware for handling file uploads.
* **Cloudinary** - Cloud storage service for profile pictures and media.

---

## ✨ Features

* **⚡ Real-Time Messaging:** Instant delivery of text messages via Socket.IO.
* **🔐 Secure Authentication:** Full Signup/Login system using JWTs stored in `HttpOnly` cookies.
* **👥 Group Chats:** Create groups, add/remove members, and manage group admins.
* **👀 Read Receipts:** Real-time double-tick updates when messages are read.
* **👤 Profile Management:** Update personal details, change passwords, and upload custom avatars.
* **🖼️ Media Sharing:** Send and receive images seamlessly within chats.
* **📱 Responsive UI:** Fully optimized interface for both desktop and mobile devices.
* **💾 Message Actions:** Support for replying to messages, forwarding, and deleting.

---

## 🛠️ Installation & Local Setup

Follow these steps to run the project locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) installed.
* [MongoDB](https://www.mongodb.com/) installed or a MongoDB Atlas URI.
* A [Cloudinary](https://cloudinary.com/) account for image storage.

### 1. Backend Setup

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Variables:** Create a `.env` file in the `server` folder and add the following:
    ```env
    # Database Connection
    MONGO_URI=your_mongodb_connection_string

    # Security
    JWT_ACCESS=your_strong_secret_key_for_jwt

    # Server Configuration
    PORT=5000
    FRONTEND_URL=http://localhost:5173

    # Cloudinary Credentials (for image uploads)
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```
4.  Start the backend server:
    ```bash
    npm run dev
    ```
    The server should be running on `http://localhost:5000`.

### 2. Frontend Setup

1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Variables:** Create a `.env` file in the `client` folder:
    ```env
    # Point this to your backend server URL
    VITE_API_URL=http://localhost:5000
    ```
4.  Start the frontend application:
    ```bash
    npm run dev
    ```
    The app should now be running at `http://localhost:5173`.

---

## 🚀 Deployment

This project is ready for deployment.

* **Frontend:** Can be deployed to services like **Vercel** or **Netlify**.
* **Backend:** Can be deployed to **Render**, **Railway**, or **Heroku**.
* **Database:** **MongoDB Atlas** is recommended for the database.

**⚠️ Important Note for Deployment:**
When deploying, ensure you update the `FRONTEND_URL` in your backend environment variables to match your deployed frontend domain (e.g., `https://your-app.vercel.app`) to avoid CORS issues.

---

**PingChat** &copy; 2025. Built with ❤️ and JavaScript.