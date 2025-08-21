import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import "../styles/history.css";
import { IconButton } from "@mui/material";

export default function History(){

    const{getHistoryOfUser}=useContext(AuthContext);

    const[meetings,setMeetings]=useState([]);

    const routeTo=useNavigate();

    useEffect(()=>{
        const fetchHistory=async ()=>{
            try{
                const history=await getHistoryOfUser();
                setMeetings(history);
            }
            catch(e){
                console.log(e);
            }
        }
        fetchHistory();
    },[]);


    return(

        <div>

            <IconButton onClick={()=>{
                routeTo("/home")
                }}>
                <HomeIcon/>
            </IconButton>

            {
                meetings.length !==0 ? 
                    
                    meetings.map(e=>{

                        return(
                            <>
                                
                                <span className="card">
                                    <div key={e} className="card-content">
                                        <div className="card-header">Code:{e.meetingCode}</div>
                                        <div className="word-type">Date:{e.date}</div>
                                        <div className="word-type">User:{e.user_id}</div>
                                    </div>
                                </span>
                            </>
                        )
                }):
                <>
                    <div>
                        No Meetings Joined Yet.
                    </div>
                </>
                }
            
        </div>
    );

}