# 🚀 CodeClash

> A Full-Stack Competitive Programming Companion Platform for creating and participating in real-time private coding contests.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-black?logo=socket.io)
![Redis](https://img.shields.io/badge/Redis-Queue-red?logo=redis)
![BullMQ](https://img.shields.io/badge/BullMQ-Background%20Jobs-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📖 Overview

CodeClash is a **Competitive Programming Companion Platform** that enables users to create and participate in private coding contests with a seamless real-time experience.

The platform automatically curates Codeforces problems based on selected ratings and tags, schedules contests, continuously tracks submissions, and updates live leaderboards instantly using WebSockets.

Unlike traditional contest platforms that rely on frontend polling, CodeClash follows an **event-driven architecture** powered by **Socket.io**, **BullMQ**, and **Redis** for scalable, low-latency contest management.

---

## ✨ Features

- 🔐 Secure Authentication
- 👥 Create & Join Private Contests
- 🎯 Automatic Codeforces Problem Selection
- 🏷️ Filter Problems by Rating & Tags
- ⏱️ Contest Scheduling
- 📊 Real-Time Leaderboards
- ⚡ Instant Submission Verdict Updates
- 🔄 Automatic Submission Tracking
- 📡 Live Contest Updates using Socket.io
- ⚙️ Background Job Processing using BullMQ + Redis
- 📈 Scalable Event-Driven Architecture

---

## 🏗️ System Architecture

```
                Codeforces API
                       │
                       ▼
              Problem Selection
                       │
                       ▼
React Client ◄──── Express API ───► MongoDB
       ▲                  │
       │                  │
       │            BullMQ Workers
       │                  │
       │               Redis Queue
       │                  │
       └──── Socket.io ◄──┘
```

---

## 🛠️ Tech Stack

### Frontend

- React.js
- React Router
- Axios
- Socket.io Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

### Real-Time & Queue

- Socket.io
- BullMQ
- Redis

### External API

- Codeforces API

### Dev Tools

- Docker
- Git
- GitHub
- Postman

---

## ⚡ How It Works

### 1. Create Contest

- User creates a private contest.
- Select contest duration.
- Choose problem ratings.
- Select desired problem tags.

---

### 2. Automatic Problem Curation

CodeClash fetches problems from the Codeforces API and randomly selects problems matching the specified:

- Rating
- Tags
- Availability

---

### 3. Contest Scheduling

BullMQ schedules the contest to start at the specified time.

---

### 4. Live Contest

During the contest:

- Participants submit solutions directly on Codeforces.
- Workers continuously monitor submissions.
- Submission verdicts are fetched automatically.
- Leaderboards update instantly via Socket.io.

---

### 5. Contest Completion

After the contest ends:

- Final leaderboard is generated.
- Contest statistics are stored.
- Participants can review rankings and solved problems.

---

## 📂 Project Structure

```
CodeClash
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── workers/
│   ├── queues/
│   └── utils/
│
└── README.md
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/yourusername/codeclash.git

cd codeclash
```

### Backend

```bash
cd server

npm install

npm run dev
```

### Frontend

```bash
cd client

npm install

npm run dev
```

---

## 📊 Highlights

- ⚡ Real-Time Contest Experience
- 🚀 Automated Contest Scheduling
- 📈 Live Leaderboards
- 🔄 Continuous Submission Monitoring
- 🏗️ Event-Driven Backend
- 💻 Full-Stack MERN Architecture
- 🔌 Codeforces API Integration
- 📡 WebSocket Communication
- ⚙️ Scalable Background Job Processing

---

## 🎯 Future Enhancements

- Virtual Contest Mode
- AI-Based Problem Recommendations
- Contest Analytics Dashboard
- Performance Graphs
- Friends & Community
- Organization Support
- Rating Prediction
- Daily Challenge System

---

## 👨‍💻 Author

**Subhodip Adhikari**

- LinkedIn: https://linkedin.com/in/subhodip-adhikari
- GitHub: https://github.com/yourusername

---

⭐ If you found this project interesting, don't forget to star the repository!
