
const menuToggle = document.querySelector(".menu-toggle");
const navbar = document.querySelector(".navbar");

menuToggle.addEventListener("click", () => {
  navbar.classList.toggle("active");

  const isOpen = navbar.classList.contains("active");
  menuToggle.setAttribute("aria-expanded", isOpen);
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");

contactForm.addEventListener("submit", function (event) {
  event.preventDefault();

  formStatus.textContent =
    "Demo only: your message has not been sent yet.";

  formStatus.style.color = "#b91c1c";
});

const donorForm = document.querySelector("#donorForm");
const donorMessage = document.querySelector("#donorMessage");

const searchForm = document.querySelector("#searchDonorForm");
const searchMessage = document.querySelector("#searchMessage");
const donorResults = document.querySelector("#donorResults");

// Read saved donors
function getDonors() {
  return JSON.parse(localStorage.getItem("bloodDonors") || "[]");
}

// Register donor and save data

// const donorForm = document.querySelector("#donorForm");
// const donorMessage = document.querySelector("#donorMessage");

const API_URL = "https://blood-connect-7cct.onrender.com/api";

donorForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!donorForm.reportValidity()) return;

  const donor = {
    name: document.querySelector("#donorName").value.trim(),
    bloodGroup: document.querySelector("#donorBlood").value,
    city: document.querySelector("#donorCity").value.trim(),
    phone: document.querySelector("#donorPhone").value.trim(),
    availability: document.querySelector("#donorAvailability").value,
    consent: document.querySelector("#donorConsent").checked
  };

  if (!donor.consent) {
    donorMessage.textContent =
      "Please provide consent before registering.";
    return;
  }

  const submitButton = donorForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  donorMessage.textContent = "Registering donor...";

  try {
    const response = await fetch(`${API_URL}/donors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(donor)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Registration failed.");
    }

    donorMessage.textContent = result.message;
    donorMessage.style.color = "#15803d";

    donorForm.reset();

  } catch (error) {
    donorMessage.textContent =
      error.message === "Failed to fetch"
        ? "Cannot reach the backend. Check that your server is running."
        : error.message;

    donorMessage.style.color = "#b91c1c";

  } finally {
    submitButton.disabled = false;
  }
});


// Search donors by blood group and city

const searchDonorForm = document.querySelector("#searchDonorForm");
// const searchMessage = document.querySelector("#searchMessage");
// const donorResults = document.querySelector("#donorResults");

searchDonorForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const bloodGroup = document.querySelector("#searchBloodGroup").value;
  const city = document.querySelector("#searchCity").value.trim();

  const params = new URLSearchParams();

  if (bloodGroup) {
    params.append("bloodGroup", bloodGroup);
  }

  if (city) {
    params.append("city", city);
  }

  searchMessage.textContent = "Searching donors...";
  donorResults.replaceChildren();

  try {
    const response = await fetch(
      `https://blood-connect-7cct.onrender.com/api/donors?${params.toString()}`
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to search donors.");
    }

    if (result.donors.length === 0) {
      searchMessage.textContent =
        "No available donors found. Try another blood group or city.";
      return;
    }

    searchMessage.textContent =
      `${result.count} available donor(s) found.`;

    result.donors.forEach(function (donor) {
      const card = document.createElement("div");
      card.className = "donor-card";

      const name = document.createElement("h3");
      name.textContent = donor.name;

      const blood = document.createElement("p");
      blood.textContent = `Blood Group: ${donor.bloodGroup}`;

      const location = document.createElement("p");
      location.textContent = `City: ${donor.city}`;

      card.append(name, blood, location);
      donorResults.appendChild(card);
    });
  } catch (error) {
    console.error("Donor search error:", error);

    searchMessage.textContent =
      "Unable to search donors. Please check whether the backend is running.";
  }
});
