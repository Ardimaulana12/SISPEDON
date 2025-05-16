# 🚀 How to Run SISPEDON

## ✅ Prerequisites

- Make sure you have [**Docker**](https://www.docker.com/) installed on your system.
- After installation, open **Docker Desktop** to ensure the Docker engine is running properly.

---

## 📥 Installation Steps

1. **Clone the Repository**

```bash
git clone https://github.com/Ardimaulana12/SISPEDON.git
cd SISPEDON
```

2. **Run the App Using Docker Compose**

```bash
docker compose -f docker-compose/compose.stag.yaml up -d --build
```

> This command will build and start all containers in detached mode.

3. **Check If All Containers Are Running**

```bash
docker ps
```

---

## 🌐 Access the App

Once the containers are running, you can access the following services:

| Service          | URL                                            | Description            |
| ---------------- | ---------------------------------------------- | ---------------------- |
| Frontend (React) | [http://localhost:5173](http://localhost:5173) | Main user interface    |
| Backend (Flask)  | [http://localhost:5000](http://localhost:5000) | API backend            |
| pgAdmin          | [http://localhost:8080](http://localhost:8080) | PostgreSQL admin panel |

> 🛡️ For pgAdmin, use the email and password configured in `docker-compose/compose.stag.yaml`.

---

## 🧹 Stopping the App

To stop and remove all running containers:

```bash
docker compose -f docker-compose/compose.stag.yaml down
```

## 🐰 Start the App Again

**If You Want To Run App Again You Can Just Run**

```bash
docker compose -f docker-compose/compose.stag.yaml up -d
```

---

## 📌 Notes

- If port `5173`, `5000`, or `8080` is already in use, make sure to free them or change the ports in the Docker Compose file.
- Make sure your `.env` or config files are correctly set up if required.

---

Thanks! 🎉
