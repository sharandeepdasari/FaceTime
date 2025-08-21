import React, { useEffect, useRef, useState } from "react";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {io} from "socket.io-client";

import "../styles/VideoComponent.css";
import IconButton from "@mui/material/IconButton";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import Badge from "@mui/material/Badge";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate } from "react-router-dom";

// server URL for signaling server (WebSocket/Socket.IO)
// this is where peers will exchange SDP offers/answers & ICE candidates
const server_url="http://localhost:8080";

//object to store peer connection each user will have one rtcpeerconnection
var connections={};


const peerConfigConnections={ // this is the configuration we pass when creating a rtcpeerconnection in webrtc. 
    "iceServers":[
        {"urls":"stun:stun.l.google.com:19302"} //stun servers are lightweught servers running on the public internet which return the ip address of the requesters device .. It’s a server on the internet that helps two devices (your laptop and your friend’s laptop/phone) find out their public IP addresses and ports so they can communicate directly (peer-to-peer). 
    ]
}

export default function VideoMeetComponenet(){

    const routeTo=useNavigate();
    //references to socket and local video element
    var socketRef=useRef();// your actual socket connection object
    let socketIdRef=useRef();// your unique id from the server for this socket 

    let localVideoRef=useRef();// video element to show our own camera 

    //states to store availability of media devices
    let [videoAvailable,setVideoAvailable]=useState(true);
    let [audioAvailable,setAudioAvailable]=useState(true);

    // states to toggle media usage || current state of camera /mic
    let [video,setVideo]=useState([]);
    let [audio,setAudio]=useState();

    // extra states for screenshare ,modal etc..
    let [screen,setScreen]=useState();
    let [showModal,setModal]=useState(false);
    let [screenAvailable,setScreenAvailable]=useState();

    //chat system states
    let [messages,setMessages]=useState([]);
    let [message,setMessage]=useState("");
    let [newMessages,setNewMessages]=useState(0);

    //username handling
    let[askForUsername,setAskForUsername]=useState(true);
    let[username,setUsername]=useState("");

    // refs for multiple remote videos
    const videoRef=useRef([]);
    let [videos,SetVideos]=useState([]);

    // if(isChrome===false)
    // {

    // }

    const getPermissions=async()=>{//to get camera ,mic ,screen permissions

        try
        {
            const videoPermission=await navigator.mediaDevices.getUserMedia({video:true});// video :true means like aaking i want access of video

            if(videoPermission)
            {
                setVideoAvailable(true);
            }
            else
            {
                setVideoAvailable(false);
            }
            const audioPermission=await navigator.mediaDevices.getUserMedia({audio:true});

            if(audioPermission)
            {
                setAudioAvailable(true);
            }
            else
            {
                setAudioAvailable(false);
            }

            if(navigator.mediaDevices.getDisplayMedia)
            {
                setScreenAvailable(true);
            }
            else
            {
                setScreenAvailable(false);
            }

            if(videoAvailable || audioAvailable)//if either one of them available start streaming
            {
                const userMediaStream=await navigator.mediaDevices.getUserMedia({
                    video:videoAvailable, // if videoavailable is true then video is true video gets streamed
                    audio:audioAvailable //if audioavailable is true then audio is true audio gets streamed
                });
                if(userMediaStream)
                {
                    window.localStream=userMediaStream;//save stream globally for later use eg: sending to peers
                    if(localVideoRef.current)//show own video preview in the <video> element
                    {
                        localVideoRef.current.srcObject=userMediaStream;
                    }
                }
            }

        }
        catch(err)
        {
            console.log(err);
        }
    }
    useEffect(()=>{
        getPermissions();
    },[])

    // let getUserMediaSuccess=(stream)=>{



    // }
    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoRef.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }


    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    
    //enable / disable for camera and mic
    let getUserMedia=()=>{

        if((video && videoAvailable) || (audio && audioAvailable))
        {
            navigator.mediaDevices.getUserMedia({video: video,audio: audio})
            .then(getUserMediaSuccess)
            .then((stream)=>{})
            .catch((e)=>{console.log(e);})
        }
        else
        {
            try
            {
                let tracks=localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track=>track.stop());
            }
            catch{

            }
        }
    }

    useEffect(()=>{
        if(video !==undefined && audio !== undefined)
        {
            getUserMedia();
        }
    },[audio,video]);

    // let gotMessageFromServer=(fromId,message)=>{

    //     var signal=JSON.parse()

    // }


     let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer=()=>{

        socketRef.current=io.connect(server_url,{secure:false});

        socketRef.current.on('signal',gotMessageFromServer);

        socketRef.current.on("connect",()=>{ // on connection established

            socketRef.current.emit("join-call",window.location.href);// join room based on your current URL

            socketIdRef.current=socketRef.current.id // save our socketId

            socketRef.current.on("chat-message",addMessage)// listen for chat messages

            socketRef.current.on("user-left",(id)=>{ // if user leaves remove their video

                SetVideos((videos)=>videos.filter((video)=>video.socketId !== id));
            })

            socketRef.current.on("user-joined",(id,clients)=>{ // if a new useer joins

                //create peer connection to eACH CLIENT
                clients.forEach((socketListId)=>{

                    connections[socketListId]=new RTCPeerConnection(peerConfigConnections);
                    
                    connections[socketListId].onicecandidate=(event)=>{//when ice candidate found send to server
                        if(event.candidate!=null)
                        {
                            socketRef.current.emit("signal",socketListId,JSON.stringify({'ice':event.candidate}))
                        }
                    }

                    connections[socketListId].onaddstream=(event)=>{//when remote stream added show video

                        let videoExists=videoRef.current.find(video=>video.socketId===socketListId)
                        if(videoExists)
                        {
                            SetVideos(videos=>{
                                const updatedVideos=videos.map(video=>
                                    video.socketId===socketListId ? {...video,stream:event.stream} : video
                                );
                                videoRef.current=updatedVideos;
                                return updatedVideos;
                            });
                        }
                        else
                        {
                            let newVideo={
                                socketId:socketListId,
                                stream:event.stream,
                                autoPlay:true,
                                playsinline:true
                            }

                            SetVideos(videos=>{

                                const updatedVideos=[...videos,newVideo];
                                videoRef.current=updatedVideos;
                                return updatedVideos;
                            })
                        }
                    };

                    if(window.localStream !== undefined && window.localStream !== null)
                    {
                        connections[socketListId].addStream(window.localStream);
                    }
                    else
                    {
                        let blackSilence=(...args)=>new MediaStream([black(...args),silence()]);
                        window.localStream=blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                })

                if(id===socketIdRef.current)
                {
                    for(let id2 in connections)
                    {
                        if(id2===socketIdRef.current) continue

                        try
                        {
                            connections[id2].addStream(window.localStream);
                        }
                        catch (error)
                        {
                            
                        }
                        connections[id2].createOffer().then((description)=>{
                            connections[id2].setLocalDescription(description)
                            .then(()=>{
                                socketRef.current.emit("signal",id2,JSON.stringify({"sdp":connections[id2].localDescription}))
                            })
                            .catch(e=>console.log(e))
                        })
                    }
                }
            })
        })
    }

    let getMedia=()=>{
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    

    let handleVideo=()=>{
        setVideo(!video);
    }

    let handleAudio=()=>{
        setAudio(!audio);
    }

    let getDisplayMediaSuccess=(stream)=>{
        try{
            window.localStream.getTracks().forEach(track=>track.stop())
        }
        catch(e)
        {
            console.log(e);
        }
        window.localStream=stream;
        localVideoRef.current.srcObject=stream;
        
        for(let id in connections)
        {
            if(id===socketIdRef.current) continue;

            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description)=>[
                connections[id].setLocalDescription(description).then(()=>{
                    socketRef.current.emit("signal",id,JSON.stringify({"sdp":connections[id].localDescription}))
                }).catch(e=>console.log(e))
            ])
        }
        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        })
    }

    let getDisplayMedia=()=>{
        if(screen)
        {
            if(navigator.mediaDevices.getDisplayMedia)
            {
                navigator.mediaDevices.getDisplayMedia({video:true,audio:true})
                .then(getDisplayMediaSuccess)
                .then((stream)=>{})
                .catch((e)=>console.log(e));
            }
        }
    }

    useEffect(()=>{
        if(screen!==undefined)
        {
            getDisplayMedia();
        }
    },[screen]);

    let handleScreen=()=>{
        setScreen(!screen);
    }

    let handleChat=()=>{
        setModal(!showModal);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        
        routeTo("/home")
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage=()=>{
        
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }
    return(
        <div>
            
            { askForUsername===true?
                <div className="lobbymain">
                    <h1>Enter into Lobby</h1>
                    <div className="lobbyjoin">
                        <TextField id="outlined-basic" label="Username"
                        value={username}
                        onChange={e=>setUsername(e.target.value)}
                        variant="outlined" />
                        <Button
                        variant="outlined"
                        onClick={connect} style={{marginLeft:"1rem",marginTop:"0.5rem"}}>
                            Connect
                        </Button>
                        </div>
                    <div>
                        <video style={{borderRadius:"10px"}} ref={localVideoRef} autoPlay muted>

                        </video>
                    </div>
                </div>:<div className="meetVideoContainer">

                    {showModal ?
                    <div className="chatRoom">
                        
                        <div className="chatContainer">
                            <h1>Chat</h1>
                            <div className="chattingDisplay">

                                {messages.length !== 0 ? messages.map((item, index) => {

                                    console.log(messages)
                                    return (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )
                                }) : <p>No Messages Yet</p>}


                            </div>

                            <div className="chattingArea">
                                <TextField
                                style={{marginBottom:"1rem"}}
                                value={message}
                                onChange={(e)=>setMessage(e.target.value)}
                                id="outlined-basic" label="Type Message" variant="outlined" />
                                <Button style={{marginTop:"0.5rem",marginLeft:"0.5rem"} } onClick={sendMessage}>Send</Button>
                            </div>
                        </div>
                    </div>:
                    <>

                    </>}
                    
                    <div className="buttonContainers">

                        <IconButton onClick={handleAudio}>
                            {(audio===true) ? <MicIcon/> : 
                            <MicOffIcon/>}
                        </IconButton>

                        <IconButton onClick={handleVideo}>
                            {(video===true) ? <VideocamIcon/> : 
                            <VideocamOffIcon/>}
                        </IconButton>
                        
                        {screenAvailable===true ?
                            <IconButton onClick={handleScreen}>
                                {(screen===true) ?
                                <ScreenShareIcon/>:
                                <StopScreenShareIcon/>}
                            </IconButton>
                        :<StopScreenShareIcon/>}

                        <Badge badgeContent={newMessages} max={999} color="secondary" style={{marginRight:"2rem"}} >
                            <IconButton style={{color:"aliceblue"}}
                            onClick={handleChat}>
                                <ChatIcon/>
                            </IconButton>
                        </Badge>

                        <IconButton style={{color:"red"}} onClick={handleEndCall}>
                            <CallEndIcon/>
                        </IconButton>

                    </div>

                    <video className="meetUserVideo" ref={localVideoRef} autoPlay muted></video>

                    <div className="conferenceView">
                    {videos.map((video)=>(
                        <div key={video.socketId}>
                            <video 
                            data-socket={video.socketId}
                            ref={ref=>{
                                if(ref && video.stream)
                                {
                                    ref.srcObject=video.stream;
                                }
                            }}
                            autoPlay
                            >

                            </video>
                        </div>
                    ))}
                    </div>
                    
                </div>

            }
        </div>
    );
}