// "use strict";
// const getUserDataByUsername = async (username) => {
//   const api = "http://localhost:3000/" + username;
//   const response = await fetch(api);
//   console.log(response);
//   const data1 = response.json();
//   console.log(data1);
//   return data1;
// };

// const getUserData = async () => {
//   const api = "http://localhost:3000/";
//   const response = await fetch(api);
//   console.log(response);
//   const data2 = response.json();
//   console.log(data2);
//   return data2;
// };

// // let data1 = getUserData();
// // console.log(data1);
// async function login() {
//   const username = document.getElementById("username").value;
//   console.log(username);
//   // getUserData();
//   // console.log(getUserData(username));
//   const data = await getUserDataByUsername(username);
//   console.log(data);

//   // await showUserData(data);
//   return username;
//   // CODE GOES HERE
// }
// // let data2 = getUserDataByUsername("khan406");
// // console.log(data2.data.name);

// window.addEventListener("load", async function getData() {
//   let data = await getUserData();
//   console.log(data);

//   await showUserData(data);
// });
// // data = JSON.parse(JSON.stringify(data));
// // console.log(data);
// // let result = data.find((item) => item);
// // console.log(result[0].name, result);
// // document.getElementById("phone").innerText = `${data.phone}`;

// // let username = document.getElementById("username").value;
// // console.log(username);
// // // const password = document.getElementById("password").value;
// // console.log(username);
// // console.log(password);
// // getUserData("khan406");
// // console.log(getUserData(username));

// // window.addEventListener("load", async function login() {
// //   const username = document.getElementById("username").value;
// //   console.log(username);
// //   // getUserData();
// //   // console.log(getUserData(username));
// //   // let dataa = await getUserData();
// //   // console.log(dataa);
// //   const data = await getUserDataByUsername(username);
// //   console.log(data);

// //   await showUserData(data);

// //   // CODE GOES HERE
// // });

// const showUserData = async (userData) => {
//   // let username = document.getElementById("username").value;
//   // console.log(username);
//   console.log(userData);
//   let result = userData.find((item) => item.username === "Sahil807");
//   console.log(result);
//   login();
//   // conaole.log(login());

//   // console.log(userData.data[2].name);

//   // console.log(userData.data.name);
//   //CODE GOES HERE
//   // let text = document.getElementsById("userId").innertext;
//   // console.log(text);
//   document.getElementById("name").innerText = `${result.name}`;
//   document.getElementById("email").innerText = `${result.email}`;
//   document.getElementById("phone").innerText = `${result.phone}`;
//   document.getElementById("companyName").innerText = `${result.companyName}`;
//   document.getElementById("filename").innerText = `${result.filename}`;
//   document.getElementById("userName").innerText = `${result.username}`;
//   document.getElementById("password").innerText = `${result.password}`;
// };
// // showUserData();
// // showUserData();
