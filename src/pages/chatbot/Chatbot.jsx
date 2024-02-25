  import React, { useEffect, useRef, useState } from "react";
  import "../../styles/chat.css";
  import { NavLink, Outlet } from "react-router-dom";
  import { io } from "socket.io-client";
  import {
    formateTimeWithChatEnd,
    getCurrentUserLT,
    getFirstLetterName,
    getToken,
    handleFullName,
    makeApiRequest,
    notify,
  } from "../../utils/utils";
  import Messaging from "./Components/Messaging";
  import NoChatSelected from "./Components/NoChatSelected";
  import { useDispatch, useSelector } from "react-redux";
  import { getChatBotMessageData } from "../../redux/slice/chatBot/chatBotSlice";
import axios from "axios";

  const Chatbot = () => {
    const dispatch = useDispatch();
    let socket = useRef();
    const [friendbox, setTab] = useState(true);
    const friendShow = () => setTab(!friendbox);
    const [Groupbox, setShow] = useState(true);
    const senderId = getCurrentUserLT()?.id;
    const [userList, setUserList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [emoji, setEmoji] = useState();
    const [documentRef, setDocumentRef] = useState([]);
    const [viewImage, setViewImage] = useState("");
    const [fileData, setFileData] = useState()
    console.log("IMAGE CHECK",viewImage);
    // const [file, setFile] = useState();
    const u = useSelector((state) => state.userByToken.user);
    const GroupShow = () => setShow(!Groupbox);
    // console.log("textFile", viewImage);

    // const handleFileChange = (e) => {
    //   // const selectedFile = e.target.files[0];
    //   // // console.log("xxxxxxxxxxxxxx",selectedFile);
    //   // if (selectedFile) {
    //   //   // const imageURL = URL.createObjectURL(selectedFile);
    //   //   // setViewImage(selectedFile.name);
    //   //   setViewImage(selectedFile);
    //   // }
      
    // };
    const handleFileChange = (event) => {
      const file = event.target.files[0];
  
      if (file && file.type.startsWith("image/")) {
        setViewImage(file);
      } else {
        setViewImage(null);
      }
    };
    // const uploadFile = async (params) => {
    //   const formData = new FormData();
    //   formData.append('chatImage', viewImage);
    //   const response = await makeApiRequest('/upload-chat-message', {
    //     method: 'POST',
    //     headers: {
    //       "Content-Type": "multipart/form-data", // Important for file uploads
    //     },
    //     body: formData,
    //   });
    //   const { fileUrl } = await response;
    //   console.log("22222222222",fileUrl);
    //   return fileUrl;
    // };
    // const uploadFile = async () => {
    //   try {
    //     const formData = new FormData();
    //     formData.append('chatImage', viewImage);
    
    //     const response = await makeApiRequest('/upload-chat-message', {
    //       method: 'POST',
    //       headers: {
    //         // Do not set Content-Type here; it will be set automatically for FormData
    //       },
    //       body: formData,
    //     });
    
    //     if (!response.ok) {
    //       throw new Error(`Upload failed with status ${response.status}`);
    //     }
    
    //     const responseData = await response.json();
    //     const { fileUrl } = responseData;
    //     console.log("File Uploaded Successfully. File URL:", fileUrl);
    //     return fileUrl;
    //   } catch (error) {
    //     console.error("Error uploading file:", error.message);
    //     // Handle error as needed
    //     // You can also notify the user about the error
    //     notify("File upload failed. Please try again.", "error");
    //     return null;
    //   }
    // };
    
    // const uploadFile = async () => {
    //   const formData = new FormData();
    //   formData.append('chatImage', viewImage);
      
    //   const response = await makeApiRequest('/upload-chat-message', {
    //     method: 'POST',
    //     body: formData,
    //   });
      
    //   const { fileUrl, fileName } = await response.json();
    //   console.log("File URL:", fileUrl);
    //   console.log("File Name:", fileName);
      
    //   return { fileUrl, fileName };
    // };
    
    // ==== proper work  code
    useEffect(() => {
      const res = io(process.env.REACT_APP_BASE_URL, {
        auth: { token: getToken() },
      });
      socket.current = res;
      socket.current.emit("addUser", senderId);
      socket.current.on("getUsers", (userList) => {
        setUserList(userList);
      });

      // this is a clean-up function for disconnected chat
      return () => {
        socket.current.disconnect();
      };
    }, [senderId]);

    useEffect(() => {
      if (socket) {
        socket.current.on("getMessage", (message) => {
          console.log(message);
          setMessages((existingMessages) => [...existingMessages, message]);
        });
      }
    }, []);

    /**
     *
     * @param {this me new function send the chat messages}
     * @returns
     */
  const uploadFile = async () => {
    // if (!viewImage) {
    //   alert('Please select a valid image file before uploading.');
    //   return;
    // }

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('chatImage', viewImage);

      // Make API request to upload the file using Axios
      const response = await axios.post('http://api.unilink360.com:3003/upload-chat-message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response && response.data) {
        // Extract the filename from the fileUrl
        const { fileUrl } = response.data;
        setFileData(fileUrl)
        // File uploaded successfully
        alert(`File ${fileUrl} uploaded successfully!`);
        return fileUrl; 
      } else {
        // Handle server error
        console.error('File upload failed:', response.statusText);
      }
    } catch (error) {
      // Handle network error or other issues
      console.error('Error uploading file:', error.message);
    }
  };
    const handleSendMessage = async (e) => {
      
      e.preventDefault();
      if (newMessage.trim() === "" && !viewImage) {
        notify("Please enter a message before sending.", "error");
        return;
      }
      // const fileUrl = await uploadFile(viewImage);
      const  fileUrl  = await uploadFile();
      console.log("dddddddddddddd",fileUrl);
      const messageData = {
        senderId: senderId,
        receiverId: selectedUser.userId,
        message: newMessage,
        fileUrl: fileUrl,
      };

      socket.current.emit("sendMessage", messageData);
      // socket.current.emit("sendMessage", formData);

      if (senderId === u.id) {
        setMessages((existingMessages) => [
          ...existingMessages,
          {
            ...messageData,
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      setNewMessage("");
    };
    const fullName = u?.fname || u?.lname ? u?.fname + " " + u?.lname : "Loading...";

    return (
      <div className="frame">
        <div className="sidepanel">
          <div class="top-profile">
            <div class="users">
              <img src={u.profileImage || "/icons-images/Profileimage.png"} />
              <h3>
                {handleFullName({ fullName, fname: u?.fname, lname: u?.lname }) ||
                  "Loading..."}{" "}
                <br />
              </h3>
            </div>
          </div>
          <div className="search">
            <label for="">
              <i className="fa fa-search" aria-hidden="true"></i>
            </label>
            <input type="text" placeholder="Search Here..." />
          </div>
          <hr />

          <div className="scrollbar">
            <div className="chatGroup">
              <h2>
              Total Friends:-  {userList?.length}
                <span onClick={friendShow}>
                  {/* <i class="fa-solid fa-chevron-down"></i> */}
                </span>
              </h2>
              {friendbox && (
                <div className="contacts">
                  <ul>
                    {userList.map((u) => {
                      return (
                        <li
                          className={
                            u.userId === selectedUser?.userId
                              ? "contact active"
                              : "contact"
                          }
                          onClick={() => setSelectedUser(u)}
                        >
                          <div className="wrap">
                            <span
                              className={
                                u.online
                                  ? "contact-status online"
                                  : "contact-status busy"
                              }
                            ></span>
                            {u.profileImage ? (
                              <>
                                {" "}
                                <img
                                  src={
                                    u.profileImage ||
                                    `${process.env.PUBLIC_URL}/icons-images/profile1.png`
                                  }
                                />
                              </>
                            ) : (
                              <>
                                {" "}
                                <div className="firstLetter">
                                  <p>
                                    {getFirstLetterName(u.fname + " " + u.lname)}
                                  </p>
                                </div>
                              </>
                            )}
                            <div className="meta w-100 ">
                              <h4 className="name position-relative">
                                {u.fname &&
                                u.lname &&
                                (u.fname.length > 10 || u.lname.length > 10)
                                  ? `${u.fname.substring(
                                      0,
                                      10
                                    )}...${u.lname.substring(0, 10)}...`
                                  : `${u.fname} ${u.lname}`}

                                {/* <p
                                  class="badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success text-light  m-0"
                                  style={{ right: "0" }}
                                >
                                  {u?.unreadMessagesCount || ""}
                                </p> */}
                              </h4>{" "}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="bottom-bar">
                <div className="row">
                  <div className="col-6">
                    <NavLink to="/dashboard">
                      <button className="addcontact">
                        <i class="fa-solid fa-house"></i> <br />
                        <span>Dashboard</span>
                      </button>
                    </NavLink>
                  </div>
                  <div className="col-6">
                    <NavLink to="/chatbot">
                      {/* <NavLink to="/chatuser"> */}
                      <button className="settings">
                        <i class="fa-regular fa-comment-dots"></i>
                        <br />
                        <span>Chats</span>
                      </button>
                    </NavLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* {file && <img src={file} alt="Uploaded File" width={"100px"} />} */}
        {/* messaging */}
        {selectedUser ? (
          <Messaging
            setMessage={setNewMessage}
            message={newMessage}
            senderId={senderId}
            chat={selectedUser}
            handleEmoji={setEmoji}
            getEmoji={emoji}
            documentRef={documentRef}
            setDocumentRef={setDocumentRef}
            viewImage={viewImage}
            // file={file}
            setViewImage={setViewImage}
            handleFileChange={handleFileChange}
            userList={userList}
            {...{ u, handleSendMessage, messages }}
          />
        ) : (
          <NoChatSelected />
        )}
      </div>
    );
  };

  export default Chatbot;

// // socket.on("sendMessage", async ({ senderId, receiverId, message, groupId, file }) => {
// //   upload(socket.request, socket.request.res, async (err) => {
// //     if (err) {
// //       console.log(err);
// //     } else {
// //       const timestamp = new Date();
// //       const sendUserSocket = onlineUsers.get(Number(receiverId));
// //       const isRead = sendUserSocket ? true : false;
// //       let filePath = ''; // Initialize file path
// //       if (socket.request.file) {
// //         filePath = `http://localhost:3003/uploads/chat/${socket.request.file.filename}`; // Construct file URL
// //       }
// //       if (sendUserSocket) {
// //         socket.to(sendUserSocket).emit("getMessage", {
// //           senderId: senderId,
// //           receiverId: receiverId,
// //           message: message,
// //           fileUrl: filePath, // Send file URL
// //           isRead: isRead,
// //           timestamp: timestamp
// //         });
// //       }
// //       await UserChatMessage.create({
// //         senderId,
// //         receiverId,
// //         message,
// //         fileUrl: filePath, // Store file URL in database
// //         timestamp,
// //         isRead
// //       });
// //     }
// //   });
// // });

// // const handleFileChange = (event) => {
// //   const file = event.target.files[0];
// //   if (file && file.type.startsWith("image/")) {
// //     const reader = new FileReader();
// //     reader.onloadend = () => {
// //       // console.log("xx",reader.result);
// //       setFile(reader.result);
// //     };
// //     reader.readAsDataURL(file);
// //   } else {
// //     setFile("/icons-images/avtar.svg");
// //   }
// // };
// // const handleFileChange = (event) => {
// //     const file = event.target.files[0];

// //     const  formData = new FormData();
// //     formData.append("file", file);

// //     setFile(file?.name)

// // };

// import React, { useState } from 'react';
// import { makeApiRequest } from '../../utils/utils';

// const Chatbot = () => {
//   const [selectedFile, setSelectedFile] = useState(null);
// console.log(selectedFile);
//   // const handleFileChange = (e) => {
//   //   // Get the selected file from the input
//   //   const file = e.target.files[0];
//   //   setSelectedFile(file);
//   // };
//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     setSelectedFile("chatImage", file);
//     if (file && file.type.startsWith("image/")) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setSelectedFile(reader.result);
//       };
//       reader.readAsDataURL(file);
//     } else {
//       setSelectedFile("/icons-images/avtar.svg");
//     }
//   };
//   const handleFileUpload = async () => {
//     if (!selectedFile) {
//       alert('Please select a file before uploading.');
//       return;
//     }
  
//     try {
//       // Create FormData to send the file
//       const formData = new FormData();
//       formData.append('chatImage', selectedFile);
  
//       // Make API request to upload the file
//       const response = await makeApiRequest('/upload-chat-message', {
//         method: 'POST',
//         body: formData,
//       });
  
//       if (response) {
//         // Extract the filename from the fileUrl
//         const  fileUrl  = await response;
//         console.log(fileUrl.fileUrl);
  
//         // File uploaded successfully
//         alert(`File ${fileUrl} uploaded successfully!`);
//       } else {
//         // Handle server error
//         console.error('File upload failed:', response.statusText);
//       }
//     } catch (error) {
//       // Handle network error or other issues
//       console.error('Error uploading file:', error.message);
//     }
//   };
  
//   return (
//     <div>
//       <input type="file"  onChange={handleFileChange} />
//       <button onClick={handleFileUpload}>Upload File</button>
//     </div>
//   );
// };

// export default Chatbot;


// import React, { useState } from 'react';
// import axios from 'axios';

// const Chatbot = () => {
//   const [selectedFile, setSelectedFile] = useState(null);

//   const handleFileChange = (event) => {
//     const file = event.target.files[0];

//     if (file && file.type.startsWith("image/")) {
//       setSelectedFile(file);
//     } else {
//       setSelectedFile(null);
//     }
//   };

//   const handleFileUpload = async () => {
//     if (!selectedFile) {
//       alert('Please select a valid image file before uploading.');
//       return;
//     }

//     try {
//       // Create FormData to send the file
//       const formData = new FormData();
//       formData.append('chatImage', selectedFile);

//       // Make API request to upload the file using Axios
//       const response = await axios.post('http://api.unilink360.com:3003/upload-chat-message', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       if (response && response.data) {
//         // Extract the filename from the fileUrl
//         const { fileUrl } = response.data;

//         // File uploaded successfully
//         alert(`File ${fileUrl} uploaded successfully!`);
//       } else {
//         // Handle server error
//         console.error('File upload failed:', response.statusText);
//       }
//     } catch (error) {
//       // Handle network error or other issues
//       console.error('Error uploading file:', error.message);
//     }
//   };

//   return (
//     <div>
//       <input type="file" onChange={handleFileChange} />
//       <button onClick={handleFileUpload}>Upload File</button>
//     </div>
//   );
// };

// export default Chatbot;
