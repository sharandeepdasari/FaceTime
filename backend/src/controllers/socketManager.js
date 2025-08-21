import { Server } from "socket.io";

let connections={}
/*
     keeps track of which socketId(user) is in which room
    {
        "roomID1": ["socketID_A", "socketID_B"],
        "roomID2": ["socketID_C"]
    }
*/
let messages={}
/*
    keeps track of the messages in each room
    messages are stored as an array of objects, each object contains the message data, sender, and the sender's socket ID
    Example:
    {
        "roomID1":
        [
            { sender: "Alice", data: "Hello!", "socket-id-sender": "socketID_A" },
            { sender: "Bob", data: "Hi!", "socket-id-sender": "socketID_B" }
        ]
    }
*/
let timeOnline={}

/*
    keeps track of when a user joined the room
    {
        "socketID_A": DateObjectForJoinTime,
        "socketID_B": DateObjectForJoinTime
    }
*/

const connectToSocket=(server)=>{
    const io=new Server(server,{
        cors: {
            origin: "*", // Allow all origins for testing, change in production
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });
    io.on("connection",(socket)=>{ //main entry-point , runs for every user that connects

        console.log("something is connected");
        socket.on("join-call",(path)=>{ // this runs when a client sends a join call event  // path is basically the roomId or callId

            if(connections[path] == undefined) // room doesnt exist yet
            {
                connections[path]=[];

            }
            connections[path].push(socket.id)// Add this user to the room

            timeOnline[socket.id]=new Date();

            for(let a=0;a<connections[path].length;a++)
            {
                io.to(connections[path][a]).emit("user-joined",socket.id,connections[path]); //notifies all users in the room that a new user has joined
            }

            if(messages[path]!= undefined) //if there are old messages in the room, send them to the new user
            {
                for(let a=0;a<messages[path].length;a++)
                {
                    io.to(socket.id). // sends them only to the new user
                    emit("chat-message",messages[path][a]['data'],messages[path][a]['sender'],messages[path][a]['socket-id-sender']);
                }
            }

        })

        socket.on("signal",(toId,message)=>{ //Used in WebRTC signaling (for video/audio peer-to-peer setup).
            io.to(toId).emit("signal",socket.id,message);
        })

        socket.on("chat-message",(data,sender)=>{ //Handles chat messages between users.data → the actual chat message (text).sender → the sender’s name or socket ID. when a chat messgae is sent

            // find the room that this socket(user) belongs to 
            const [matchingRoom,found]=Object.entries(connections).reduce(([room,isFound],[roomKey,roomValue])=>{
                if(!isFound && roomValue.includes(socket.id))
                {
                    return [roomKey,true]; // found the room return it
                }
                return [room,isFound]; // keep current room  and found state

            },['',false]); // intial values -> no room found yet

            if(found==true)
            {
                // if the room doesnt have a messgae history yet create one
                if(messages[matchingRoom]==undefined)
                {
                    messages[matchingRoom]=[];
                }
                // save the message to rooms history
                messages[matchingRoom].push
                ({
                    "sender":sender,
                    "data":data,
                    "socket-id-sender":socket.id
                });

                console.log("message",matchingRoom,":",sender,data); // print the message to console

                // send the new messgae to everyone in the same room
                connections[matchingRoom].forEach(element => {
                    io.to(element).emit("chat-message",data,sender,socket.id);
                });
            }
        })

        socket.on("disconnect",()=>{ // runs automatically when a user disconnects

            var diffTime=Math.abs(timeOnline[socket.id]-new Date()); // calculates how long the user was connected or active.

            var key;// will hold the roomId that the user was in

            //Loop through all rooms (connections object stores rooms → user socket IDs)
            for(const[k,v] of JSON.parse(JSON.stringify(Object.entries(connections))))
            {
                // Object.entries(connections) → array like [["room1", [id1, id2]], ["room2", [id3]]]
                // JSON.parse(JSON.stringify(...)) is used here to clone the data so the loop
                // isn't affected if we modify `connections` while iterating.
                // k = roomid/path, v = array of socket IDs in that room.
                for(let a=0;a<v.length;a++)// loop through all users in the current room
                {
                    if(v[a]==socket.id) // found the disconnecting user id in this room
                    {
                        key=k;// save the roomid
                        for(let i=0;i<connections[key].length;i++)
                        {
                            io.to(connections[key][i]).emit("user-left",socket.id); // notifies all users in the room that a user has left
                        }

                        var index=connections[key].indexOf(socket.id);
                        connections[key].splice(index,1);// remove the user from the room he is in

                        if(connections[key].length==0)
                        {
                            delete connections[key];// if the room is now empty delete the room
                            delete messages[key]; // also delete the message history of the room
                        }
                    }
                }
            }
        })
    })

    return io;
};

export default connectToSocket;
