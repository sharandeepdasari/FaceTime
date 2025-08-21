import axios from "axios"; // for sending http requests to backend api
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react"; //react hooks and context api
import { useNavigate } from "react-router-dom";// for navigating between pages programitically
import server from "../environment";


export const AuthContext = createContext({});// create a authentication context thisis a container to store and share authentication data functions

const client = axios.create({
    baseURL: "http://localhost:8080/api/v1/users" // what ever the request we send from here gets send to this route
})


export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext); // Get the initial context value (empty at first)


    const [userData, setUserData] = useState(authContext);// store logged-in users data in a state variable 


    const router = useNavigate();// for page redirection after login or register

    //register a new user
    const handleRegister = async (name, username, password) => {
        try {
            // send post req to /register api
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })

            // if registration was successfull 
            if (request.status === httpStatus.CREATED) {
                return request.data.message; // return the success message from backend
            }
        } catch (err) {
            throw err;
        }
    }


    //log in a user
    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", { //send post request to /login api
                username: username,
                password: password
            });

            console.log(username, password)
            console.log(request.data)

            //if login is successsfull 
            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);// save token in browsers local storage for later use
                router("/home")//redirect to /home page
            }
        } catch (err) {
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data;
        } catch
         (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }


    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}