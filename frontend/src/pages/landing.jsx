import React from "react";
import "../App.css";
import GetStarted from "../getstarted";
import { useNavigate } from "react-router-dom";


export default function LandingPage() {
    
const router=useNavigate();

    return (
        <div className="loadingpagecontainer">
            <nav className="hpnavbar">
                <div>
                    <button className="appname"> <img src="/appicon.png" alt="" className="appicon" /> FaceTime</button>
                </div>
                <div className="navlinks">
                    <p onClick={()=>{
                        router("/6yhegge3")
                    }}>Join as Guest</p>
                    <p onClick={()=>{
                            router("/authentication")
                        }}>Register</p>
                    <div role='button'
                        onClick={()=>{
                            router("/authentication")
                        }}
                    >
                        <p>Login</p>
                    </div>
                </div>
            </nav>
            <div className="loadingpagecontent">
                <div className="loadingpagecontentleft">
                    <h1><span style={{color:"#FF9839"}}>Connect</span> with your</h1>
                    <h1>Loved Ones</h1>
                    <p>Cover a distance by FaceTime</p>
                    <div>
                        <GetStarted title="Get Started" className="getstartedbutton"/>
                    </div>
                </div>
                <div className="loadingpagecontentright">
                    <img src="/mobile.png" alt="Landing Page" />
                </div>
            </div>
        </div>
    );
};