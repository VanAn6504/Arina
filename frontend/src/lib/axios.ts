import axios from "axios" //thu vien goi api

const api = axios.create({
    baseURL: //tu dong doi theo mt dev, deploy
        import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api", //if app chay dev thi chay link else chay /api
        withCredentials: true //cookie gui len server
})
export default api;