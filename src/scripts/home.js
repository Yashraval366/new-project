document.addEventListener("DOMContentLoaded", () => {
    const signInBtn = document.getElementById("open-signin");
    const signInPlaceholder = document.getElementById("signin-placeholder");
    const profileDropdown = document.getElementById("profile-dropdown");
    const profileBtn = document.getElementById("profile-btn");
    const dropdownMenu = document.getElementById("dropdownMenu");
    let bookslot;

    signInBtn.addEventListener("click", loadSignInForm);

    const getgaragesInfo = async () => {
        const garagesContainer = document.getElementById('garage-list');

        try {
            const response = await fetch('http://localhost:5001/api/garages/garagesinfo');
            const data = await response.json();

            console.log(data);
            const garages = data.Garages;

            garagesContainer.innerHTML = ""; 

            garages.forEach((garage) => {
                const garageCard = document.createElement('div');
                garageCard.setAttribute("class", "garage-card");

                const garageImg = document.createElement('img');
                garageImg.setAttribute("class", "garage-image");
                garageImg.src = `http://localhost:5001${garage.garage_image}`;

                const garageName = document.createElement('h3');
                garageName.setAttribute("class", "garage-name");
                garageName.innerHTML = garage.garage_name;

                
                const locationContainer = document.createElement('div');
                locationContainer.setAttribute("class", "label-container");
                const locationLabel = document.createElement('label');
                locationLabel.setAttribute("class", "locationlabel");
                locationLabel.innerHTML = "Location:";
                const garagelocation = document.createElement('p');
                garagelocation.setAttribute("class", "garage-location");
                garagelocation.innerHTML = garage.garage_location;
                locationContainer.appendChild(locationLabel);
                locationContainer.appendChild(garagelocation);

            
                const queueContainer = document.createElement('div');
                queueContainer.setAttribute("class", "label-container");
                const queuelabel = document.createElement('label');
                queuelabel.setAttribute("class", "queuelabel");
                queuelabel.innerHTML = "Queue:";
                const queue = document.createElement('div');
                queue.setAttribute("class", "queue");

                for (let i = 0; i < garage.queue_count; i++) {
                    const dot = document.createElement("span");
                    dot.setAttribute("class", "dot");
                    queue.appendChild(dot);
                }

                queueContainer.appendChild(queuelabel);
                queueContainer.appendChild(queue);

                const bookslot = document.createElement('button');
                bookslot.setAttribute("class", "book-btn open-bookbtn");
                bookslot.innerHTML = "Book slot";
                bookslot.onclick = () => openBookSlot(garage.id, garage.garage_name);

                garageCard.appendChild(garageImg);
                garageCard.appendChild(garageName);
                garageCard.appendChild(locationContainer);
                garageCard.appendChild(queueContainer);
                garageCard.appendChild(bookslot);

                garagesContainer.appendChild(garageCard);
            });

        } catch (err) {
            garagesContainer.innerHTML = "No Data Found";
            console.log("Error: ", err);
        }
    };

    getgaragesInfo();

    function loadSignInForm() {
    fetch("./pages/signIn.html")
        .then(response => response.text())
        .then(html => {
            signInPlaceholder.innerHTML = html;

            const signInContainer = document.getElementById("signin-container");
            if (signInContainer) {

                const closeSignIn = document.getElementById("close-signin");

                signInContainer.classList.remove("fade-out");
                signInContainer.classList.add("fade-in");
                signInContainer.style.display = "flex"; 

                loginHandler();

                closeSignIn.addEventListener("click", () => closeSignInForm(signInContainer));

                window.addEventListener("click", (event) => {
                    if (event.target === signInContainer) {
                        closeSignInForm(signInContainer);
                    }
                });
            }

        })
        .catch(error => console.error("Error loading sign-in form:", error));
}

    function closeSignInForm(container) {
        container.classList.remove("fade-in");
        container.classList.add("fade-out");
        setTimeout(() => {
            container.style.display = "none";
        }, 500);
    }

    function loginHandler() {
        document.getElementById("login-form").addEventListener("submit", async (event) => {
            event.preventDefault();
            await loginUser();
        });
    }

    async function loginUser() {
        try {
            const form = document.getElementById('login-form');
            const formData = new FormData(form);
            const jsonData = Object.fromEntries(formData.entries());


            const response = await fetch("http://localhost:5001/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jsonData)
            });

            const data = await response.json();
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("userRole", jsonData.role); 

            if (!response.ok) throw new Error(data.message || "Login failed");

            alert("Login successfully");

            const tokenPayload = JSON.parse(atob(data.token.split(".")[1]));

            console.log("Decoded Token: ",tokenPayload)

            if(jsonData.role === "garageowner") {
                window.location.href = "./pages/garagedashboard.html";
                console.log(data.token, jsonData.role)
            } else {
                window.location.href = "#"
            }

            
            updateUI();
            form.reset();
            document.getElementById("signin-container").style.display = "none";
            
        } catch (error) {
            console.error("Login error:", error);
            alert(error.message);
        }
    }

    async function updateUI() {
        const signInBtn = document.getElementById("open-signin");
        const profileDropdown = document.getElementById("profile-dropdown");
        const token = localStorage.getItem("authToken");

        if (!token) {
            signInBtn.style.display = "block"; 
            profileDropdown.style.display = "none"; 
            return;
        }

        try {
            const response = await fetch("http://localhost:5001/api/users/check-auth", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Invalid token");

            signInBtn.style.display = "none"; 
            profileDropdown.style.display = "inline-block";

            document.getElementById('logout').addEventListener("click", logoutUser)

        } catch (error) {
            console.warn("Invalid token, logging out");
            logoutUser();
        }
    }

    document.addEventListener("click", (event) => {
        const profileBtn = event.target.closest("#profile-btn");
        if (profileBtn) {
            document.getElementById("dropdownMenu").classList.toggle("active");
        }

        const dropdown = document.getElementById("dropdownMenu");
        if (dropdown && !dropdown.contains(event.target) && event.target.id !== "profile-btn") {
            dropdown.classList.remove("active");
        }
    });

    async function checkAuth() {
        const token = localStorage.getItem("authToken");

        if (!token) return logoutUser();

        try {
            const response = await fetch("http://localhost:5001/api/users/check-auth", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Session expired");
        } catch (error) {
            console.warn(error.message);
            logoutUser();
        }
    }

    function logoutUser() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        updateUI();
    }

    updateUI();

    setInterval(checkAuth, 5 * 60 * 1000);

    
    function openBookSlot(garageId, garageName) {
        const bookslotPlaceholder = document.getElementById("bookslot-placeholder");

        fetch("./pages/bookslot.html")
            .then(response => response.text())
            .then(html => {
                bookslotPlaceholder.innerHTML = html; 
                
                const bookslotContainer = document.getElementById("modal-container");
                const closeBookslot = document.getElementById("close-bookslot");

                const garageNameInput = document.getElementById("garage-name");
                if (garageNameInput) {
                    garageNameInput.value = garageName;
                    garageNameInput.setAttribute("data-garage-id", garageId);
                    localStorage.setItem("garage-id",garageId)
                }

                if (bookslotContainer.classList.contains("fade-in")) return;

                bookslotContainer.style.display = "flex";

                closeBookslot?.addEventListener("click", () => closeModal(bookslotContainer));

                window.addEventListener("click", (event) => {
                    if (event.target === bookslotContainer) closeModal(bookslotContainer);
                });

                function showServiceOptions() {
                    const serviceDropdown = document.getElementById("services");
                    const serviceOptions = document.getElementById("service-options");
                    if (serviceDropdown.value !== "") {
                        serviceOptions.style.display = "block";
                    } else {
                        serviceOptions.style.display = "none";
                    }
                }

                document.getElementById('services').addEventListener('change', showServiceOptions())
                bookslotHandler()

            })
        .catch(error => console.error("Error loading book slot form:", error));
    }

    async function dataIntobookslot() {
        const token = localStorage.getItem("authToken");
        const form = document.getElementById('bookslot-form')
        const formData = new FormData(form);

        if(!token){
            alert("please SignIn first!")
        }

        gid = localStorage.getItem("garage-id")

        formData.set("garage_id", gid);
        formData.set("garage_name", document.getElementById('garage-name').value);
        formData.set("name", document.getElementById('name').value);
        console.log(document.getElementById('name').value)
        formData.set("email", document.getElementById('email').value);
        console.log(document.getElementById('email').value)
        formData.set("date", document.getElementById('date').value);
        formData.set("time", document.getElementById('time').value);
        formData.set("service", document.getElementById('services').value);
        
        console.log("Submitting FormData:", Object.fromEntries(formData.entries()));

        const jsonData = Object.fromEntries(formData.entries());

        const response = await fetch("http://localhost:5001/api/bookslot/setbookslot", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
             },
            body: JSON.stringify(jsonData), 
        });

        const data = await response.json();

        console.log(data)

        if(!response.ok) throw new Error(data.message || "something went wrong pls try again");

        alert('Bookslot Successfully')

        if(response.ok){
            form.reset();
        }
    }


    function bookslotHandler() {
        document.getElementById("bookslot-form").addEventListener("submit", async (event) => {
            event.preventDefault();
            await dataIntobookslot();
        });
    }

    function closeModal(modal) {
        modal.classList.remove("fade-in");
        modal.classList.add("fade-out");
        setTimeout(() => {
            modal.style.display = "none";
            modal.classList.remove("fade-out");
        }, 1000);
    }
});
