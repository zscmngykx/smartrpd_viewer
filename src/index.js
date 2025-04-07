// Import the THREE.js library
import * as THREE from "three";
// To allow for the camera to move around the scene
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";

import { STLMeshLoader } from './STLMeshLoader.js';

console.log(THREE.REVISION);
// Import the OFFLoader class
import { OFFLoader } from './OFFLoader.js';
// Import the ApiClient class
import { ApiClient } from './ApiClient.js';

import { addVisibilityAndTransparencyControls } from './control.js';
import { addResetButton } from './resetButton.js';
import {lol} from './crypt.js';

//initialise everything
let all_mesh_mat = {};
window.finished = false;

// Get the current URL
const url = new URL(window.location.href);
console.log("🧩 Current URL:", url.href);
console.log("🧩 Extracted id:", url.searchParams.get("id"));

// Get the value of a specific query parameter, e.g., "param"
let paramValue = url.searchParams.get('id');
const close = url.searchParams.get('close')

//decrypts the paramvalue
//if doing testing with test cases jus comment it out
paramValue = lol(paramValue);





// Create a Three.JS Scene
const scene = new THREE.Scene();
// Create a new camera with positions and angles
let camera
const aspect = window.innerWidth / window.innerHeight;
camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -500, 1000);


// Keep track of the mouse position, so we can make the eye move
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let undercut_type = {};
// Keep the 3D object on a global variable so we can access it later


// OrbitControls allow the camera to move around the scene
let controls;
let orb_controls;

// Set which object to render
let objToRender = 'dino';
let mesh_geo;

// Create a material
const material = new THREE.MeshPhongMaterial({ vertexColors: true })
const materialsurface = new THREE.MeshStandardMaterial({
  color: 0xA0A0A0,  // Base color
  metalness: 0.75,   // Fully metallic
  roughness: 0.2    // Smooth surface
});
const materialsurface_non_metal = new THREE.MeshStandardMaterial({
  color: 0xA0A0A0,  // Base color
  metalness: 0,   // Fully metallic
  roughness: 0.2    // Smooth surface
});


// Create an instance of the ApiClient with the base URL
const apiClient = new ApiClient('https://live.api.smartrpdai.com/api/smartrpd');
const parentObject = new THREE.Object3D();
scene.add(parentObject);












//The async prevents processing of data before the stuff is loaded in

(async () => {


  //datas :)
  // this for the undercut upper and the main json data use to retrieve stuff
  const data = {
    machine_id: '3a0df9c37b50873c63cebecd7bed73152a5ef616',
	  uuid: 'AC4gRQXZJoNz9EhhW36Q8jMJXBsf',
    //uuid: 'eOqJe2FpjqdECy25l0KuJkH2cPQm', // dev server acc uuid
    case_int_id: paramValue,
    jaw_type: 2,
    caseIntID: paramValue


  };
    // this for the undercut lower
  const data2 = {
    machine_id: '3a0df9c37b50873c63cebecd7bed73152a5ef616',
    uuid: 'AC4gRQXZJoNz9EhhW36Q8jMJXBsf',
    //uuid: 'eOqJe2FpjqdECy25l0KuJkH2cPQm', // dev server acc uuid
    case_int_id: paramValue,
    jaw_type: 1,
    caseIntID: paramValue


  };
  
  let positionDatas = [];
  let positionData;

  
  

  












  //This section is for the processing of creation date, case id and last updated

  const urldatas = ['/case/get/' + paramValue];
  try {
    // Call the post method and wait for the response
    for (const urldata of urldatas) {

      positionData = await apiClient.post(urldata, [data],false,'Case Info');
      //console.log('Success:', positionData)
      positionDatas = positionDatas.concat(positionData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  //for all the text info
  const time = unixToHumanReadable(positionData.creation_date);
  const update_time = unixToHumanReadable(positionData.last_updated)
  createTextbox("Creation Date: " + time, 'bottom-left');
  createTextbox("Case Name: " + positionData.case_id, 'bottom-right');
  createTextbox("Last Updated: " + update_time + " Last Edited by: "+ positionData.username, 'bottom-left2');


  const thumbnail_url = ['/thumbnails/get'];
  try {
    // Call the post method and wait for the response
    for (const urldata of thumbnail_url) {

      const thumbnailData = await apiClient.post(urldata, [data],false,'2D image');
      //console.log('Success thumb:', thumbnailData)
      for(const thumb in thumbnailData)
      {
        if(thumbnailData[thumb].slot == 0)
        {
        const test = thumbnailData[thumb].data;
        const button = document.createElement('button');
        button.style.position = 'fixed';
        
        button.style.top = '0px';  // Adjust position as needed
        button.style.right = '290px';
        button.style.padding = '0';
        button.style.border = 'none';
        button.style.background = 'none';
        button.style.cursor = 'pointer';
        button.style.width ='30px';
        button.style.height ='30px';
        
        
        
        // Create an image element
        const img = new Image();
        img.src = 'data:image/png;base64,' + test; // Assuming 'test' is your base64 PNG data
        img.style.transform = `scale(0.3)`;
        // Append the image to the button
        button.appendChild(img);
        
        // Handle button click
        button.addEventListener('click', function() {
          // Define the action when the button is clicked, e.g., open a modal
          displayFullScreenImage(img);
          //console.log('Button clicked!');
        });
        
        // Append the button to the body or another container
        document.body.appendChild(button);


        }

      }
      
    }
  } catch (error) {
    console.error('Error:', error);
  }







  // to get the undercut and occulsion values
  let undercut_values = [];

  const heatmap_urldatas = ['/undercutheatmap/get'];
  try {
    // Call the post method and wait for the response


    const undercut_value = await apiClient.post(heatmap_urldatas, data,false,"Heatmap upper");
    undercut_values = undercut_values.concat(undercut_value);
    //console.log('Success:', undercut_value)


    undercut_type[undercut_value.jaw_type] = [Boolean(undercut_value.surveying_values), Boolean(undercut_value.occlusion_values)];


    const undercut_value1 = await apiClient.post(heatmap_urldatas, data2,false,"Heatmap lower");
    undercut_values = undercut_values.concat(undercut_value1);


    undercut_type[undercut_value1.jaw_type] = [Boolean(undercut_value1.surveying_values), Boolean(undercut_value1.occlusion_values)];

  } catch (error) {
    console.error('Error:', error);
  }







  //Processing mesh

  // stl will be true is fail to process parameterisation
  let stl = false;
  const urls = ['/parameterisation/mesh/getall', '/surface/getall'];
  let responseDatas = [];
  let responseData;
  let loop = 0;
  try {
    // Call the post method and wait for the response
    for (const url of urls) {
      loop +=1;
      //console.log('raw: ' + close);


// this is for the generation of button to change to closed mesh if it exist
let name_of_mesh;
      if (!close) {
        if(url == '/parameterisation/mesh/getall')
        {
          name_of_mesh = 'Jaw mesh';
        }
        else if(url == '/surface/getall')
        {
          name_of_mesh = 'Denture mesh';
        }
        responseData = await apiClient.post(url, [data],false,name_of_mesh);
        //console.log(responseData);
        if (isObject(responseData)) {
          responseDatas = responseDatas.concat(responseData);
        }
        //loop to prevent repeated check
        if(loop == 1)
          {
            //check for closed.off
        const test = await apiClient.post('/stl/get', [data],'test','Jaw mesh');

        if (test != 'stl') {
          // Create a button element
          const button = document.createElement('button');
          button.textContent = 'Close.off'; // Set the text content of the button

          // Style the button
          button.style.position = 'fixed';
          button.style.bottom = '45px';  // Adjust the bottom position as needed
          button.style.right = '20px';   // Adjust the right position as needed
          button.style.padding = '10px';
          button.style.backgroundColor = 'blue';
          button.style.color = 'white';
          button.style.border = 'none';
          button.style.cursor = 'pointer';
          button.style.borderRadius = '5px';
          button.style.zIndex = '1000';  // Ensure it's above other elements

          // Function to handle button click
          function redirectToUrl() {
            // Change this URL to the desired destination

            window.location.href = window.location.href + '&close=true';  // Redirect to the specified URL
          }

          // Add click event listener to button
          button.addEventListener('click', redirectToUrl);

          // Append the button to the body or another container
          document.body.appendChild(button);

        }
      }
      }

      if (responseData == 'stl' && url == '/parameterisation/mesh/getall' && !close) {
        responseData = 'stl';
        responseData = await apiClient.post('/stl/raw/get', [data],false,"Jaw mesh");
        stl = true;
      }
      else if (close && url == '/parameterisation/mesh/getall') {
          responseData = 'stl';
          responseData = await apiClient.post('/stl/get', [data],false,'Jaw mesh');
          //console.log(responseData);
          stl = false;
          const button = document.createElement('button');
          button.textContent = 'Back to original'; // Set the text content of the button

          // Style the button
          button.style.position = 'fixed';
          button.style.bottom = '45px';  // Adjust the bottom position as needed
          button.style.right = '10px';   // Adjust the right position as needed
          button.style.padding = '10px';
          button.style.backgroundColor = 'blue';  
          button.style.color = 'white';
          button.style.border = 'none';
          button.style.cursor = 'pointer';
          button.style.borderRadius = '5px';
          button.style.zIndex = '1000';  // Ensure it's above other elements

          // Function to handle button click
          function redirectToUrl() {
            // Change this URL to the desired destination

            window.location.href = window.location.href.slice(0, -11);  // Redirect to the specified URL
          }

          // Add click event listener to button
          button.addEventListener('click', redirectToUrl);

          // Append the button to the body or another container
          document.body.appendChild(button);
        }
      else
      {
        responseData = 'stl';
      }
        //console.log('e')

        //console.log('Success:', responseData);
        if (isObject(responseData)) {
          responseDatas = responseDatas.concat(responseData);
        }



      }

    }
   catch (error) {
    console.error('Error:', error);
  }



//console.log(responseDatas);
  for (const offFile of responseDatas) {
    let loader;
    //console.log(offFile)
    if (offFile.filename.includes('surface')) {
      loader = new OFFLoader(materialsurface.clone(),materialsurface_non_metal.clone());
    }
    else {
      loader = new OFFLoader(material.clone());
    }

    // Fetch the OFF file data
    //const offData = await apiClient.get(offFile); // Assuming the ApiClient has a get method for fetching data
    const offdata = atob(offFile.data);
    let x;
    if (offFile.filename.includes('ParameterisationMesh') || offFile.filename.includes('closed')) {
      x = true;
    }
    // Load the OFF file
    //console.log('check stl:' + stl)
    if (stl) {

      const stlMeshLoader = new STLMeshLoader(material);
      if (offFile.type.includes('upper')) {

        mesh_geo = stlMeshLoader.load(offdata, undercut_values[1]);
      }
      else if (offFile.type.includes('lower')) {

        mesh_geo = stlMeshLoader.load(offdata, undercut_values[0]);
      }


    }

    else if (offFile.type.includes('upper')) {

      mesh_geo = loader.parse(offdata, undercut_values[1], x);
    }
    else if (offFile.type.includes('lower')) {
      mesh_geo = loader.parse(offdata, undercut_values[0], x);
    }

    const mesh = mesh_geo[0]
    mesh.name = offFile.filename;

    mesh.userData = {
      jaw_type: offFile.type
    }
    if (all_mesh_mat != null) {
      all_mesh_mat[offFile.filename] = mesh_geo[1].slice();

    }

    //addVisibilityControl(mesh, 'BoxMesh');
    //addTransparencyControl(material, 'BoxMesh');
    /*
    if(offFile.filename.includes('surface')[])
      {
        if(offFile.filename.includes('upper'))
          {
            changeMeshRotation(mesh,pos['upper'][0],pos['upper'][1],pos['upper'][2]);
          }
          else{
            changeMeshRotation(mesh,pos['lower'][0],pos['lower'][1],pos['lower'][2]);
          }
      }
          */
    // Add the mesh to the parent object


    if (offFile.type.includes('upper') && !stl && !close) {
      //console.log('check');
      changeMeshRotation(mesh, 1, 1, 180);
      mesh.position.y += 5;
    }


    //console.log(mesh)
    /*
    if(stl)
      {
        changeMeshRotation(mesh,0,105,0);
      }
        */
    parentObject.add(mesh);

  }
  //console.log(all_mesh_mat);

  function changeMeshRotation(mesh, x, y, z) {
    mesh.rotation.set(THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z));
  }





  // Example usage
  function createTextbox(text, position) {
    const textbox = document.createElement('div');
    textbox.textContent = text;
    textbox.style.position = 'fixed';
    textbox.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    textbox.style.padding = '5px';
    textbox.style.border = '1px solid #ccc';
    textbox.style.borderRadius = '5px';
    textbox.style.fontFamily = 'Arial, sans-serif';
    textbox.style.fontSize = '15px';
    textbox.style.color = '#333';
    textbox.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';

    textbox.style.height = '15px';

    // Optionally, add a media query to adjust size for very small screens


    if (position === 'bottom-left') {
      textbox.style.bottom = '55px';
      textbox.style.left = '10px';
      textbox.style.height = '30px';
      textbox.style.minWidth = '220px'
      textbox.style.width = '20%';
      textbox.style.maxWidth = '250px';

    } else if (position === 'bottom-right') {
      textbox.width = '150px'
      textbox.style.bottom = '10px';
      textbox.style.right = '10px';
    }
    else if (position === 'bottom-left2') {
      textbox.style.bottom = '10px';
      textbox.style.padding = '5px';
      textbox.style.left = '10px';
      textbox.style.height = '30px';
      textbox.style.minWidth = '220px'
      textbox.style.width = '20%';
      textbox.style.maxWidth = '250px';

    }
    else if(position === 'name')
    {
      textbox.style.bottom = '10px';
      textbox.style.right = '10px';
      textbox.style.height = '30px';
      textbox.style.padding = '5px';
      
    }

    document.body.appendChild(textbox);
  }

  function unixToHumanReadable(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }














  // Instantiate the OFFLoader


  // Load the OFF file

  finished = true;
  // Instantiate a new renderer and set its size
  const renderer = new THREE.WebGLRenderer({ alpha: true }); // Alpha: true allows for the transparent background
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Add the renderer to the DOM
  const container = document.getElementById("container3D");
  if (container) {
    container.appendChild(renderer.domElement);
  } else {
    console.error('No container element found');
  }

  // Set how far the camera will be from the 3D model

  camera.position.z = objToRender === "dino" ? 100 : 500;

  // Add lights to the scene, so we can actually see the 3D model
  const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft white light
  scene.add(ambientLight);

  // Add directional lights from different directions for even lighting
  const lights = [
    new THREE.DirectionalLight(0xffffff, 1), // Front light
    new THREE.DirectionalLight(0xffffff, 1), // Back light
    new THREE.DirectionalLight(0xffffff, 1), // Left light
    new THREE.DirectionalLight(0xffffff, 1), // Right light
  ];

  lights[0].position.set(0, 0, 1);
  lights[1].position.set(0, 0, -1);
  lights[2].position.set(-1, 0, 0);
  lights[3].position.set(1, 0, 0);

  lights.forEach(light => {
    scene.add(light);
  });


  // This adds controls to the camera, so we can rotate / zoom it with the mouse
  if (objToRender === 'dino') {
    controls = new TrackballControls(camera, renderer.domElement);
    orb_controls = new OrbitControls(camera, renderer.domElement);

    controls.rotateSpeed = 4.0;
    orb_controls.zoomSpeed = 2;
    orb_controls.enableRotate = false;
    orb_controls.enabelePan = true;

    controls.panSpeed = 30;
    controls.noZoom = true;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;




    //console.log('changed2');
  }

  // Render the scene
  function animate() {
    requestAnimationFrame(animate);
    // Here we could add some code to update the scene, adding some automatic movement
    controls.update();
    // Make the eye move

    renderer.render(scene, camera);
  }

  // Add a listener to the window, so we can resize the window and the camera
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Add mouse position listener, so we can make the eye move
  document.onmousemove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };



  camera.zoom = 7;
  camera.updateProjectionMatrix();
  const clonedCamera = camera.clone();
  addResetButton(camera, clonedCamera, controls);
  //console.log(camera)


  // Start the 3D rendering
  animate();
  //console.log(parentObject);
  //console.log(undercut_type);
  addVisibilityAndTransparencyControls(parentObject, name, all_mesh_mat, undercut_type);
  
  const urlLogout = ['/user/logout'];
  try {
    // Call the post method and wait for the response
    for (const urldata of urlLogout) {

      const check = await apiClient.post(urldata, [data]);
      //console.log('Success logout:', check)

    }
  } catch (error) {
    console.error('Error:', error);
  }
    
})();






function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function displayFullScreenImage(img) {
  // Create a fullscreen container
  const fullscreenContainer = document.createElement('div');
  fullscreenContainer.style.position = 'fixed';
  fullscreenContainer.style.top = '0';
  fullscreenContainer.style.left = '0';
  fullscreenContainer.style.width = '100%';
  fullscreenContainer.style.height = '100%';
  fullscreenContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'; // Semi-transparent black background
  fullscreenContainer.style.zIndex = '1000'; // Ensure it's above other content
  fullscreenContainer.style.display = 'flex';
  fullscreenContainer.style.justifyContent = 'center';
  fullscreenContainer.style.alignItems = 'center';
  
  // Calculate maximum dimensions for the fullscreen image
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  let maxImageWidth;
  let maxImageHeight;
  //if is mobile then expand image
  if(isMobileDevice())
  {
    maxImageWidth = screenWidth * 0.9; // Adjust as needed, e.g., 90% of screen width
    maxImageHeight = screenHeight * 0.9; // Adjust as needed, e.g., 90% of screen height
  }
  else
  {
    maxImageWidth = img.width;
    maxImageHeight = img.height;
  }

  
  // Create an image element inside the fullscreen container
  const fullscreenImg = new Image();
  fullscreenImg.src = img.src; // Set the source of the fullscreen image
  
  // Calculate image dimensions to maintain aspect ratio
  const aspectRatio = img.width / img.height;
  let displayWidth = maxImageWidth;
  let displayHeight = maxImageWidth / aspectRatio;
  
  // Adjust based on height if necessary
  if (displayHeight > maxImageHeight) {
    displayHeight = maxImageHeight;
    displayWidth = maxImageHeight * aspectRatio;
  }
  
  // Apply calculated dimensions and styles to the image
  fullscreenImg.style.width = `${displayWidth}px`;
  fullscreenImg.style.height = `${displayHeight}px`;
  fullscreenImg.style.objectFit = 'contain'; // Maintain aspect ratio
  const touchMoveHandler = function(event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
};

const wheelHandler = function(event) {
    if (event.ctrlKey) {
        event.preventDefault();
    }
};
document.addEventListener('touchmove', touchMoveHandler, { passive: false });
document.addEventListener('wheel', wheelHandler, { passive: false });
  // Append the fullscreen image to the container
  fullscreenContainer.appendChild(fullscreenImg);
  
  // Close fullscreen on click outside the image
  fullscreenContainer.addEventListener('click', function() {
    document.removeEventListener('touchmove', touchMoveHandler, { passive: false });
    document.removeEventListener('wheel', wheelHandler, { passive: false });
    document.body.removeChild(fullscreenContainer); // Remove fullscreen container
    
  });
  
  // Append the fullscreen container to the body
  document.body.appendChild(fullscreenContainer);
}

function isObject(variable) {
  return variable !== null && typeof variable === 'object';
}

window.addEventListener("load", () => {
  const fixToothMapPosition = () => {
    const allButtons = document.getElementsByTagName("button");
    for (let btn of allButtons) {
      const img = btn.querySelector("img");

      if (img && img.src.startsWith("data:image/png;base64")) {
        // ✅ 精确对齐 Rotation 下方 + 放大
        btn.style.position = "fixed";
        btn.style.top = "180px";
        btn.style.right = "15px";
        btn.style.width = "140px";
        btn.style.height = "auto";
        btn.style.padding = "0";
        btn.style.border = "none";
        btn.style.background = "none";
        btn.style.cursor = "pointer";
        btn.style.zIndex = "1000";

        img.style.width = "100%";
        img.style.height = "auto";
        img.style.transform = "none";
        img.style.display = "block";

        return true;
      }
    }
    return false;
  };

  const interval = setInterval(() => {
    if (fixToothMapPosition()) {
      clearInterval(interval);
    }
  }, 200);
});

window.addEventListener("load", () => {
  const interval = setInterval(() => {
    const allButtons = document.getElementsByTagName("button");

    for (let btn of allButtons) {
      const img = btn.querySelector("img");

      if (img && img.src.startsWith("data:image/png")) {
        if (!btn.hasAttribute("data-zoom-bound")) {
          btn.setAttribute("data-zoom-bound", "true");

          btn.addEventListener("click", () => {
            const overlayDivs = document.querySelectorAll("div[style*='position: fixed']");
            for (let div of overlayDivs) {
              const popupImg = div.querySelector("img");
              if (popupImg && popupImg.src.startsWith("data:image/png")) {
                popupImg.style.maxWidth = "80vw";
                popupImg.style.maxHeight = "80vh";
                popupImg.style.width = "auto";
                popupImg.style.height = "auto";
                break;
              }
            }
          });
        }

        clearInterval(interval);
        break;
      }
    }
  }, 300);
});

